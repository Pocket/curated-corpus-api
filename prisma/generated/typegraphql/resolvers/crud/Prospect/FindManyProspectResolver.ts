import * as TypeGraphQL from "type-graphql";
import graphqlFields from "graphql-fields";
import { GraphQLResolveInfo } from "graphql";
import { FindManyProspectArgs } from "./args/FindManyProspectArgs";
import { Prospect } from "../../../models/Prospect";
import { transformFields, getPrismaFromContext, transformCountFieldIntoSelectRelationsCount } from "../../../helpers";

@TypeGraphQL.Resolver(_of => Prospect)
export class FindManyProspectResolver {
  @TypeGraphQL.Query(_returns => [Prospect], {
    nullable: false
  })
  async prospects(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: FindManyProspectArgs): Promise<Prospect[]> {
    return getPrismaFromContext(ctx).prospect.findMany(args);
  }
}
