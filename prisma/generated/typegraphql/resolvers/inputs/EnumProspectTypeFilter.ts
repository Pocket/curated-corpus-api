import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "@prisma/client";
import { DecimalJSScalar } from "../../scalars";
import { NestedEnumProspectTypeFilter } from "../inputs/NestedEnumProspectTypeFilter";
import { ProspectType } from "../../enums/ProspectType";

@TypeGraphQL.InputType({
  isAbstract: true
})
export class EnumProspectTypeFilter {
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

  @TypeGraphQL.Field(_type => NestedEnumProspectTypeFilter, {
    nullable: true
  })
  not?: NestedEnumProspectTypeFilter | undefined;
}
