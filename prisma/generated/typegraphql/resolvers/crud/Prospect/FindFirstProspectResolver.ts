import * as TypeGraphQL from "type-graphql";
import graphqlFields from "graphql-fields";
import { GraphQLResolveInfo } from "graphql";
import { FindFirstProspectArgs } from "./args/FindFirstProspectArgs";
import { Prospect } from "../../../models/Prospect";
import { transformFields, getPrismaFromContext, transformCountFieldIntoSelectRelationsCount } from "../../../helpers";

@TypeGraphQL.Resolver(_of => Prospect)
export class FindFirstProspectResolver {
  @TypeGraphQL.Query(_returns => Prospect, {
    nullable: true
  })
  async findFirstProspect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: FindFirstProspectArgs): Promise<Prospect | null> {
    return getPrismaFromContext(ctx).prospect.findFirst(args);
  }
}
