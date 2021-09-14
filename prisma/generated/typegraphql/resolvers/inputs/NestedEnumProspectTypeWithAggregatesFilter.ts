import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "@prisma/client";
import { DecimalJSScalar } from "../../scalars";
import { NestedEnumProspectTypeFilter } from "../inputs/NestedEnumProspectTypeFilter";
import { NestedIntFilter } from "../inputs/NestedIntFilter";
import { ProspectType } from "../../enums/ProspectType";

@TypeGraphQL.InputType({
  isAbstract: true
})
export class NestedEnumProspectTypeWithAggregatesFilter {
  @TypeGraphQL.Field(_type => ProspectType, {
    nullable: true
  })
  equals?: "TYPE_ONE" | "TYPE_TWO" | undefined;

  @TypeGraphQL.Field(_type => [ProspectType], {
    nullable: true
  })
  in?: Array<"TYPE_ONE" | "TYPE_TWO"> | undefined;

  @TypeGraphQL.Field(_type => [ProspectType], {
    nullable: true
  })
  notIn?: Array<"TYPE_ONE" | "TYPE_TWO"> | undefined;

  @TypeGraphQL.Field(_type => NestedEnumProspectTypeWithAggregatesFilter, {
    nullable: true
  })
  not?: NestedEnumProspectTypeWithAggregatesFilter | undefined;

  @TypeGraphQL.Field(_type => NestedIntFilter, {
    nullable: true
  })
  _count?: NestedIntFilter | undefined;

  @TypeGraphQL.Field(_type => NestedEnumProspectTypeFilter, {
    nullable: true
  })
  _min?: NestedEnumProspectTypeFilter | undefined;

  @TypeGraphQL.Field(_type => NestedEnumProspectTypeFilter, {
    nullable: true
  })
  _max?: NestedEnumProspectTypeFilter | undefined;
}
