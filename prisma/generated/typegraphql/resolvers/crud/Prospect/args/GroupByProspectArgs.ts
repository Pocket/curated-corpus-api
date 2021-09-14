import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { ProspectOrderByInput } from "../../../inputs/ProspectOrderByInput";
import { ProspectScalarWhereWithAggregatesInput } from "../../../inputs/ProspectScalarWhereWithAggregatesInput";
import { ProspectWhereInput } from "../../../inputs/ProspectWhereInput";
import { ProspectScalarFieldEnum } from "../../../../enums/ProspectScalarFieldEnum";

@TypeGraphQL.ArgsType()
export class GroupByProspectArgs {
  @TypeGraphQL.Field(_type => ProspectWhereInput, {
    nullable: true
  })
  where?: ProspectWhereInput | undefined;

  @TypeGraphQL.Field(_type => [ProspectOrderByInput], {
    nullable: true
  })
  orderBy?: ProspectOrderByInput[] | undefined;

  @TypeGraphQL.Field(_type => [ProspectScalarFieldEnum], {
    nullable: false
  })
  by!: Array<"id" | "externalId" | "url" | "title" | "type">;

  @TypeGraphQL.Field(_type => ProspectScalarWhereWithAggregatesInput, {
    nullable: true
  })
  having?: ProspectScalarWhereWithAggregatesInput | undefined;

  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: true
  })
  take?: number | undefined;

  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: true
  })
  skip?: number | undefined;
}
