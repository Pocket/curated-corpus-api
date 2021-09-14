import * as TypeGraphQL from "type-graphql";
import graphqlFields from "graphql-fields";
import { GraphQLResolveInfo } from "graphql";
import { UpsertProspectArgs } from "./args/UpsertProspectArgs";
import { Prospect } from "../../../models/Prospect";
import { transformFields, getPrismaFromContext, transformCountFieldIntoSelectRelationsCount } from "../../../helpers";

@TypeGraphQL.Resolver(_of => Prospect)
export class UpsertProspectResolver {
  @TypeGraphQL.Mutation(_returns => Prospect, {
    nullable: false
  })
  async upsertProspect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: UpsertProspectArgs): Promise<Prospect> {
    return getPrismaFromContext(ctx).prospect.upsert(args);
  }
}
