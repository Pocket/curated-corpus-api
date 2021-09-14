import * as TypeGraphQL from "type-graphql";

export enum ProspectScalarFieldEnum {
  id = "id",
  externalId = "externalId",
  url = "url",
  title = "title",
  type = "type"
}
TypeGraphQL.registerEnumType(ProspectScalarFieldEnum, {
  name: "ProspectScalarFieldEnum",
  description: undefined,
});
