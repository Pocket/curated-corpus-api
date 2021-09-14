import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { ProspectCreateInput } from "../../../inputs/ProspectCreateInput";

@TypeGraphQL.ArgsType()
export class CreateProspectArgs {
  @TypeGraphQL.Field(_type => ProspectCreateInput, {
    nullable: false
  })
  data!: ProspectCreateInput;
}
