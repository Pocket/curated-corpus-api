import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "@prisma/client";
import { DecimalJSScalar } from "../../scalars";
import { EnumProspectTypeWithAggregatesFilter } from "../inputs/EnumProspectTypeWithAggregatesFilter";
import { IntWithAggregatesFilter } from "../inputs/IntWithAggregatesFilter";
import { StringWithAggregatesFilter } from "../inputs/StringWithAggregatesFilter";

@TypeGraphQL.InputType({
  isAbstract: true
})
export class ProspectScalarWhereWithAggregatesInput {
  @TypeGraphQL.Field(_type => [ProspectScalarWhereWithAggregatesInput], {
    nullable: true
  })
  AND?: ProspectScalarWhereWithAggregatesInput[] | undefined;

  @TypeGraphQL.Field(_type => [ProspectScalarWhereWithAggregatesInput], {
    nullable: true
  })
  OR?: ProspectScalarWhereWithAggregatesInput[] | undefined;

  @TypeGraphQL.Field(_type => [ProspectScalarWhereWithAggregatesInput], {
    nullable: true
  })
  NOT?: ProspectScalarWhereWithAggregatesInput[] | undefined;

  @TypeGraphQL.Field(_type => IntWithAggregatesFilter, {
    nullable: true
  })
  id?: IntWithAggregatesFilter | undefined;

  @TypeGraphQL.Field(_type => StringWithAggregatesFilter, {
    nullable: true
  })
  externalId?: StringWithAggregatesFilter | undefined;

  @TypeGraphQL.Field(_type => StringWithAggregatesFilter, {
    nullable: true
  })
  url?: StringWithAggregatesFilter | undefined;

  @TypeGraphQL.Field(_type => StringWithAggregatesFilter, {
    nullable: true
  })
  title?: StringWithAggregatesFilter | undefined;

  @TypeGraphQL.Field(_type => EnumProspectTypeWithAggregatesFilter, {
    nullable: true
  })
  type?: EnumProspectTypeWithAggregatesFilter | undefined;
}
