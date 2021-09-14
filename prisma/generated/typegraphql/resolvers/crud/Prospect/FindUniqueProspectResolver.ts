import * as TypeGraphQL from "type-graphql";
import graphqlFields from "graphql-fields";
import { GraphQLResolveInfo } from "graphql";
import { FindUniqueProspectArgs } from "./args/FindUniqueProspectArgs";
import { Prospect } from "../../../models/Prospect";
import { transformFields, getPrismaFromContext, transformCountFieldIntoSelectRelationsCount } from "../../../helpers";

@TypeGraphQL.Resolver(_of => Prospect)
export class FindUniqueProspectResolver {
  @TypeGraphQL.Query(_returns => Prospect, {
    nullable: true
  })
  async prospect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: FindUniqueProspectArgs): Promise<Prospect | null> {
    return getPrismaFromContext(ctx).prospect.findUnique(args);
  }
}
