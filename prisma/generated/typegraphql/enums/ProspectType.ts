import * as TypeGraphQL from "type-graphql";

export enum ProspectType {
  TYPE_ONE = "TYPE_ONE",
  TYPE_TWO = "TYPE_TWO"
}
TypeGraphQL.registerEnumType(ProspectType, {
  name: "ProspectType",
  description: undefined,
});
