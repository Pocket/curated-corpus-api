import { Construct } from 'constructs';
import {
  App,
  DataTerraformRemoteState,
  RemoteBackend,
  TerraformStack,
} from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { PagerdutyProvider } from '@cdktf/provider-pagerduty/lib/provider';
import { LocalProvider } from '@cdktf/provider-local/lib/provider';
import { NullProvider } from '@cdktf/provider-null/lib/provider';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { config } from './config';
import {
  ApplicationRDSCluster,
  PocketALBApplication,
  PocketAwsSyntheticChecks,
  PocketECSCodePipeline,
  PocketPagerDuty,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import { DataAwsSnsTopic } from '@cdktf/provider-aws/lib/data-aws-sns-topic';
import { DataAwsKmsAlias } from '@cdktf/provider-aws/lib/data-aws-kms-alias';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';

class CuratedCorpusAPI extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, 'aws', { region: 'us-east-1' });
    new LocalProvider(this, 'local_provider');
    new NullProvider(this, 'null_provider');
    new PagerdutyProvider(this, 'pagerduty_provider', { token: undefined });

    new RemoteBackend(this, {
      hostname: 'app.terraform.io',
      organization: 'Pocket',
      workspaces: [{ prefix: `${config.name}-` }],
    });

    const caller = new DataAwsCallerIdentity(this, 'caller');
    const region = new DataAwsRegion(this, 'region');
    const pocketVpc = new PocketVPC(this, 'pocket-vpc');
    const curatedCorpusPagerduty = this.createPagerDuty();

    const pocketApp = this.createPocketAlbApplication({
      rds: this.createRds(pocketVpc),
      s3: this.createS3Bucket(),
      pagerDuty: curatedCorpusPagerduty,
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      region,
      caller,
    });

    this.createApplicationCodePipeline(pocketApp);

    new PocketAwsSyntheticChecks(this, 'synthetics', {
      // alarmTopicArn: config.environment === 'Prod' ? curatedCorpusPagerduty.snsCriticalAlarmTopic.arn : '', // this should be improved, empty string recreates updates constantly as is in cdktf
      alarmTopicArn: '', // remove this line & uncomment above line when we're ready to alert on synchecks
      environment: process.env.NODE_ENV === 'development' ? 'Dev' : 'Prod', // yes we should use config.environment, but needs more refinment in module
      prefix: config.prefix,
      query: [
        {
          // New Tab relies upon scheduledSurface query & upon corpusItem resolution
          endpoint: config.domain,
          data: '{"query": "query { scheduledSurface(id: \\"NEW_TAB_EN_US\\") {items(date: \\"2023-05-30\\") {corpusItem {id, url}}}}"}',
          jmespath:
            'to_string(data.scheduledSurface.items[].corpusItem[] | [0].id != null)', // confirm all corpusItems have a non-null id field present
          response: 'true',
        },
      ],
      securityGroupIds: pocketVpc.defaultSecurityGroups.ids,
      shortName: config.shortName,
      subnetIds: pocketVpc.privateSubnetIds,
      tags: config.tags,
      uptime: [
        {
          // is the express server up?
          response: 'ok',
          url: `${config.domain}/.well-known/apollo/server-health`,
        },
      ],
    });
  }

  /**
   * Get the sns topic for code deploy
   * @private
   */
  private getCodeDeploySnsTopic() {
    return new DataAwsSnsTopic(this, 'backend_notifications', {
      name: `Backend-${config.environment}-ChatBot`,
    });
  }

  /**
   * Get secrets manager kms alias
   * @private
   */
  private getSecretsManagerKmsAlias() {
    return new DataAwsKmsAlias(this, 'kms_alias', {
      name: 'alias/aws/secretsmanager',
    });
  }

  /**
   * Create S3 bucket for image uploads
   * @private
   */
  private createS3Bucket() {
    return new S3Bucket(this, 'image-uploads', {
      bucket: `pocket-${config.prefix.toLowerCase()}-images`,
    });
  }

  /**
   * Creat Aurora database
   * @param pocketVpc
   * @private
   */
  private createRds(pocketVpc: PocketVPC) {
    return new ApplicationRDSCluster(this, 'rds', {
      prefix: config.prefix,
      vpcId: pocketVpc.vpc.id,
      subnetIds: pocketVpc.privateSubnetIds,
      rdsConfig: {
        databaseName: 'curation_corpus',
        masterUsername: 'pkt_curation_corpus',
        engine: 'aurora-mysql',
        engineMode: 'serverless',
        scalingConfiguration: {
          minCapacity: config.rds.minCapacity,
          maxCapacity: config.rds.maxCapacity,
          autoPause: false,
        },
      },

      tags: config.tags,
    });
  }

  /**
   * Create CodePipeline to build and deploy terraform and ecs
   * @param app
   * @private
   */
  private createApplicationCodePipeline(app: PocketALBApplication) {
    new PocketECSCodePipeline(this, 'code-pipeline', {
      prefix: config.prefix,
      source: {
        codeStarConnectionArn: config.codePipeline.githubConnectionArn,
        repository: config.codePipeline.repository,
        branchName: config.codePipeline.branch,
      },
    });
  }

  /**
   * Create PagerDuty service for alerts
   * @private
   */
  private createPagerDuty() {
    const incidentManagement = new DataTerraformRemoteState(
      this,
      'incident_management',
      {
        organization: 'Pocket',
        workspaces: {
          name: 'incident-management',
        },
      }
    );

    return new PocketPagerDuty(this, 'pagerduty', {
      prefix: config.prefix,
      service: {
        criticalEscalationPolicyId: incidentManagement
          .get('policy_backend_critical_id')
          .toString(),
        nonCriticalEscalationPolicyId: incidentManagement
          .get('policy_backend_non_critical_id')
          .toString(),
      },
    });
  }

  private createPocketAlbApplication(dependencies: {
    rds: ApplicationRDSCluster;
    s3: S3Bucket;
    pagerDuty: PocketPagerDuty;
    region: DataAwsRegion;
    caller: DataAwsCallerIdentity;
    secretsManagerKmsAlias: DataAwsKmsAlias;
    snsTopic: DataAwsSnsTopic;
  }): PocketALBApplication {
    const {
      rds,
      s3,
      pagerDuty,
      region,
      caller,
      secretsManagerKmsAlias,
      snsTopic,
    } = dependencies;

    return new PocketALBApplication(this, 'application', {
      internal: true,
      prefix: config.prefix,
      alb6CharacterPrefix: config.shortName,
      tags: config.tags,
      cdn: false,
      domain: config.domain,
      containerConfigs: [
        {
          name: 'app',
          portMappings: [
            {
              hostPort: 4025,
              containerPort: 4025,
            },
          ],
          healthCheck: config.healthCheck,
          envVars: [
            {
              name: 'NODE_ENV',
              value: process.env.NODE_ENV,
            },
            {
              name: 'AWS_S3_BUCKET',
              value: s3.id,
            },
            {
              name: 'SNOWPLOW_ENDPOINT',
              value: config.envVars.snowplowEndpoint,
            },
            {
              name: 'EVENT_BUS_NAME',
              value: config.eventBus.name,
            },
            {
              name: 'AWS_REGION',
              value: region.name,
            },
          ],
          secretEnvVars: [
            {
              name: 'SENTRY_DSN',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
            },
            {
              name: 'DATABASE_URL',
              valueFrom: `${rds.secretARN}:database_url::`,
            },
          ],
        },
        {
          name: 'xray-daemon',
          containerImage: 'amazon/aws-xray-daemon',
          repositoryCredentialsParam: `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/DockerHub`,
          portMappings: [
            {
              hostPort: 2000,
              containerPort: 2000,
              protocol: 'udp',
            },
          ],
          command: ['--region', 'us-east-1', '--local-mode'],
        },
      ],
      codeDeploy: {
        useCodeDeploy: true,
        useCodePipeline: true,
        snsNotificationTopicArn: snsTopic.arn,
        notifications: {
          //only notify on failed deploys
          notifyOnFailed: true,
          notifyOnStarted: false,
          notifyOnSucceeded: false,
        },
      },
      exposedContainer: {
        name: 'app',
        port: 4025,
        healthCheckPath: '/.well-known/apollo/server-health',
      },
      ecsIamConfig: {
        prefix: config.prefix,
        taskExecutionRolePolicyStatements: [
          //This policy could probably go in the shared module in the future.
          {
            actions: ['secretsmanager:GetSecretValue', 'kms:Decrypt'],
            resources: [
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:Shared/*`,
              secretsManagerKmsAlias.targetKeyArn,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.name}/${config.environment}/*`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.prefix}`,
              `arn:aws:secretsmanager:${region.name}:${caller.accountId}:secret:${config.prefix}/*`,
            ],
            effect: 'Allow',
          },
          //This policy could probably go in the shared module in the future.
          {
            actions: ['ssm:GetParameter*'],
            resources: [
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}`,
              `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/*`,
            ],
            effect: 'Allow',
          },
        ],
        taskRolePolicyStatements: [
          {
            actions: [
              'xray:PutTraceSegments',
              'xray:PutTelemetryRecords',
              'xray:GetSamplingRules',
              'xray:GetSamplingTargets',
              'xray:GetSamplingStatisticSummaries',
            ],
            resources: ['*'],
            effect: 'Allow',
          },
          {
            actions: ['s3:*'],
            resources: [`arn:aws:s3:::${s3.id}`, `arn:aws:s3:::${s3.id}/*`],
            effect: 'Allow',
          },
          {
            actions: ['events:PutEvents'],
            resources: [
              `arn:aws:events:${region.name}:${caller.accountId}:event-bus/${config.eventBus.name}`,
            ],
            effect: 'Allow',
          },
        ],
        taskExecutionDefaultAttachmentArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      autoscalingConfig: {
        targetMinCapacity: 2,
        targetMaxCapacity: 10,
      },
      alarms: {
        // A non-critical alarm will be raised if request latency
        // exceeds 500 ms within a 15-minute period four times in a row.
        httpLatency: {
          evaluationPeriods: 4, // 1 hr total
          threshold: 500, // 500 ms
          period: 900, // 15 minutes
          actions: config.isDev ? [] : [pagerDuty.snsNonCriticalAlarmTopic.arn],
        },
      },
    });
  }
}

const app = new App();
new CuratedCorpusAPI(app, 'curated-corpus-api');
app.synth();
