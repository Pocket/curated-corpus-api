import * as TypeGraphQL from "type-graphql";
import graphqlFields from "graphql-fields";
import { GraphQLResolveInfo } from "graphql";
import { DeleteProspectArgs } from "./args/DeleteProspectArgs";
import { Prospect } from "../../../models/Prospect";
import { transformFields, getPrismaFromContext, transformCountFieldIntoSelectRelationsCount } from "../../../helpers";

@TypeGraphQL.Resolver(_of => Prospect)
export class DeleteProspectResolver {
  @TypeGraphQL.Mutation(_returns => Prospect, {
    nullable: true
  })
  async deleteProspect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: DeleteProspectArgs): Promise<Prospect | null> {
    return getPrismaFromContext(ctx).prospect.delete(args);
  }
}
