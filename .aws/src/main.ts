import { Construct } from 'constructs';
import {
  App,
  DataTerraformRemoteState,
  RemoteBackend,
  TerraformStack,
} from 'cdktf';
import {
  AwsProvider,
  DataAwsCallerIdentity,
  DataAwsKmsAlias,
  DataAwsRegion,
  DataAwsSnsTopic,
} from '@cdktf/provider-aws';
import { config } from './config';
import {
  PocketALBApplication,
  PocketECSCodePipeline,
  PocketPagerDuty,
  PocketVPC,
} from '@pocket-tools/terraform-modules';
import { PagerdutyProvider } from '@cdktf/provider-pagerduty';

class ProspectCurationAPI extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, 'aws', { region: 'us-east-1' });

    new PagerdutyProvider(this, 'pagerduty_provider', { token: undefined });

    new RemoteBackend(this, {
      hostname: 'app.terraform.io',
      organization: 'Pocket',
      workspaces: [{ prefix: `${config.name}-` }],
    });

    const pocketVpc = new PocketVPC(this, 'pocket-vpc');
    const region = new DataAwsRegion(this, 'region');
    const caller = new DataAwsCallerIdentity(this, 'caller');

    const pocketApp = this.createPocketAlbApplication({
      pagerDuty: this.createPagerDuty(),
      secretsManagerKmsAlias: this.getSecretsManagerKmsAlias(),
      snsTopic: this.getCodeDeploySnsTopic(),
      region,
      caller,
    });

    this.createApplicationCodePipeline(pocketApp);
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
        criticalEscalationPolicyId: incidentManagement.get(
          'policy_backend_critical_id'
        ),
        nonCriticalEscalationPolicyId: incidentManagement.get(
          'policy_backend_non_critical_id'
        ),
      },
    });
  }

  private createPocketAlbApplication(dependencies: {
    pagerDuty: PocketPagerDuty;
    region: DataAwsRegion;
    caller: DataAwsCallerIdentity;
    secretsManagerKmsAlias: DataAwsKmsAlias;
    snsTopic: DataAwsSnsTopic;
  }): PocketALBApplication {
    const { pagerDuty, region, caller, secretsManagerKmsAlias, snsTopic } =
      dependencies;

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
          ],
          secretEnvVars: [
            {
              name: 'SENTRY_DSN',
              valueFrom: `arn:aws:ssm:${region.name}:${caller.accountId}:parameter/${config.name}/${config.environment}/SENTRY_DSN`,
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
        ],
        taskExecutionDefaultAttachmentArn:
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
      },
      autoscalingConfig: {
        targetMinCapacity: 2,
        targetMaxCapacity: 10,
      },
      alarms: {
        //TODO: Add alarms when the API is ready
        http5xxError: {
          threshold: 10,
          evaluationPeriods: 2,
          period: 600,
          actions: [],
        },
        httpLatency: {
          evaluationPeriods: 2,
          threshold: 500,
          actions: [],
        },
        httpRequestCount: {
          threshold: 5000,
          evaluationPeriods: 2,
          actions: [],
        },
      },
    });
  }
}

const app = new App();
new ProspectCurationAPI(app, 'prospect-curation-api');
app.synth();
