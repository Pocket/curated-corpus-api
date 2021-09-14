import * as TypeGraphQL from "type-graphql";
import graphqlFields from "graphql-fields";
import { GraphQLResolveInfo } from "graphql";
import { AggregateProspectArgs } from "./args/AggregateProspectArgs";
import { CreateManyProspectArgs } from "./args/CreateManyProspectArgs";
import { CreateProspectArgs } from "./args/CreateProspectArgs";
import { DeleteManyProspectArgs } from "./args/DeleteManyProspectArgs";
import { DeleteProspectArgs } from "./args/DeleteProspectArgs";
import { FindFirstProspectArgs } from "./args/FindFirstProspectArgs";
import { FindManyProspectArgs } from "./args/FindManyProspectArgs";
import { FindUniqueProspectArgs } from "./args/FindUniqueProspectArgs";
import { GroupByProspectArgs } from "./args/GroupByProspectArgs";
import { UpdateManyProspectArgs } from "./args/UpdateManyProspectArgs";
import { UpdateProspectArgs } from "./args/UpdateProspectArgs";
import { UpsertProspectArgs } from "./args/UpsertProspectArgs";
import { transformFields, getPrismaFromContext, transformCountFieldIntoSelectRelationsCount } from "../../../helpers";
import { Prospect } from "../../../models/Prospect";
import { AffectedRowsOutput } from "../../outputs/AffectedRowsOutput";
import { AggregateProspect } from "../../outputs/AggregateProspect";
import { ProspectGroupBy } from "../../outputs/ProspectGroupBy";

@TypeGraphQL.Resolver(_of => Prospect)
export class ProspectCrudResolver {
  @TypeGraphQL.Query(_returns => Prospect, {
    nullable: true
  })
  async prospect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: FindUniqueProspectArgs): Promise<Prospect | null> {
    return getPrismaFromContext(ctx).prospect.findUnique(args);
  }

  @TypeGraphQL.Query(_returns => Prospect, {
    nullable: true
  })
  async findFirstProspect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: FindFirstProspectArgs): Promise<Prospect | null> {
    return getPrismaFromContext(ctx).prospect.findFirst(args);
  }

  @TypeGraphQL.Query(_returns => [Prospect], {
    nullable: false
  })
  async prospects(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: FindManyProspectArgs): Promise<Prospect[]> {
    return getPrismaFromContext(ctx).prospect.findMany(args);
  }

  @TypeGraphQL.Mutation(_returns => Prospect, {
    nullable: false
  })
  async createProspect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: CreateProspectArgs): Promise<Prospect> {
    return getPrismaFromContext(ctx).prospect.create(args);
  }

  @TypeGraphQL.Mutation(_returns => AffectedRowsOutput, {
    nullable: false
  })
  async createManyProspect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: CreateManyProspectArgs): Promise<AffectedRowsOutput> {
    return getPrismaFromContext(ctx).prospect.createMany(args);
  }

  @TypeGraphQL.Mutation(_returns => Prospect, {
    nullable: true
  })
  async deleteProspect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: DeleteProspectArgs): Promise<Prospect | null> {
    return getPrismaFromContext(ctx).prospect.delete(args);
  }

  @TypeGraphQL.Mutation(_returns => Prospect, {
    nullable: true
  })
  async updateProspect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: UpdateProspectArgs): Promise<Prospect | null> {
    return getPrismaFromContext(ctx).prospect.update(args);
  }

  @TypeGraphQL.Mutation(_returns => AffectedRowsOutput, {
    nullable: false
  })
  async deleteManyProspect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: DeleteManyProspectArgs): Promise<AffectedRowsOutput> {
    return getPrismaFromContext(ctx).prospect.deleteMany(args);
  }

  @TypeGraphQL.Mutation(_returns => AffectedRowsOutput, {
    nullable: false
  })
  async updateManyProspect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: UpdateManyProspectArgs): Promise<AffectedRowsOutput> {
    return getPrismaFromContext(ctx).prospect.updateMany(args);
  }

  @TypeGraphQL.Mutation(_returns => Prospect, {
    nullable: false
  })
  async upsertProspect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: UpsertProspectArgs): Promise<Prospect> {
    return getPrismaFromContext(ctx).prospect.upsert(args);
  }

  @TypeGraphQL.Query(_returns => AggregateProspect, {
    nullable: false
  })
  async aggregateProspect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: AggregateProspectArgs): Promise<AggregateProspect> {
    return getPrismaFromContext(ctx).prospect.aggregate({
      ...args,
      ...transformFields(graphqlFields(info as any)),
    });
  }

  @TypeGraphQL.Query(_returns => [ProspectGroupBy], {
    nullable: false
  })
  async groupByProspect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: GroupByProspectArgs): Promise<ProspectGroupBy[]> {
    const { _count, _avg, _sum, _min, _max } = transformFields(
      graphqlFields(info as any)
    );
    return getPrismaFromContext(ctx).prospect.groupBy({
      ...args,
      ...Object.fromEntries(
        Object.entries({ _count, _avg, _sum, _min, _max }).filter(([_, v]) => v != null)
      ),
    });
  }
}
