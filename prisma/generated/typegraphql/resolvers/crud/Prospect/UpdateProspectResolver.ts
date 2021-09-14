import * as TypeGraphQL from "type-graphql";
import graphqlFields from "graphql-fields";
import { GraphQLResolveInfo } from "graphql";
import { UpdateProspectArgs } from "./args/UpdateProspectArgs";
import { Prospect } from "../../../models/Prospect";
import { transformFields, getPrismaFromContext, transformCountFieldIntoSelectRelationsCount } from "../../../helpers";

@TypeGraphQL.Resolver(_of => Prospect)
export class UpdateProspectResolver {
  @TypeGraphQL.Mutation(_returns => Prospect, {
    nullable: true
  })
  async updateProspect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: UpdateProspectArgs): Promise<Prospect | null> {
    return getPrismaFromContext(ctx).prospect.update(args);
  }
}
