import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "@prisma/client";
import { DecimalJSScalar } from "../../scalars";
import { ProspectType } from "../../enums/ProspectType";

@TypeGraphQL.InputType({
  isAbstract: true
})
export class EnumProspectTypeFieldUpdateOperationsInput {
  @TypeGraphQL.Field(_type => ProspectType, {
    nullable: true
  })
  set?: "TYPE_ONE" | "TYPE_TWO" | undefined;
}
