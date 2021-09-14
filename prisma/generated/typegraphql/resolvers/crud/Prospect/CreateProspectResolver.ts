import * as TypeGraphQL from "type-graphql";
import graphqlFields from "graphql-fields";
import { GraphQLResolveInfo } from "graphql";
import { CreateProspectArgs } from "./args/CreateProspectArgs";
import { Prospect } from "../../../models/Prospect";
import { transformFields, getPrismaFromContext, transformCountFieldIntoSelectRelationsCount } from "../../../helpers";

@TypeGraphQL.Resolver(_of => Prospect)
export class CreateProspectResolver {
  @TypeGraphQL.Mutation(_returns => Prospect, {
    nullable: false
  })
  async createProspect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: CreateProspectArgs): Promise<Prospect> {
    return getPrismaFromContext(ctx).prospect.create(args);
  }
}
