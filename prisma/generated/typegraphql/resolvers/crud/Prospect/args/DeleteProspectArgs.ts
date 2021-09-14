import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { ProspectWhereUniqueInput } from "../../../inputs/ProspectWhereUniqueInput";

@TypeGraphQL.ArgsType()
export class DeleteProspectArgs {
  @TypeGraphQL.Field(_type => ProspectWhereUniqueInput, {
    nullable: false
  })
  where!: ProspectWhereUniqueInput;
}
