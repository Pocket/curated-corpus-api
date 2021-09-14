import * as TypeGraphQL from "type-graphql";
import graphqlFields from "graphql-fields";
import { GraphQLResolveInfo } from "graphql";
import { AggregateProspectArgs } from "./args/AggregateProspectArgs";
import { Prospect } from "../../../models/Prospect";
import { AggregateProspect } from "../../outputs/AggregateProspect";
import { transformFields, getPrismaFromContext, transformCountFieldIntoSelectRelationsCount } from "../../../helpers";

@TypeGraphQL.Resolver(_of => Prospect)
export class AggregateProspectResolver {
  @TypeGraphQL.Query(_returns => AggregateProspect, {
    nullable: false
  })
  async aggregateProspect(@TypeGraphQL.Ctx() ctx: any, @TypeGraphQL.Info() info: GraphQLResolveInfo, @TypeGraphQL.Args() args: AggregateProspectArgs): Promise<AggregateProspect> {
    return getPrismaFromContext(ctx).prospect.aggregate({
      ...args,
      ...transformFields(graphqlFields(info as any)),
    });
  }
}
