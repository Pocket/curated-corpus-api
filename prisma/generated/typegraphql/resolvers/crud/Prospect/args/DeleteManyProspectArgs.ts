import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { ProspectWhereInput } from "../../../inputs/ProspectWhereInput";

@TypeGraphQL.ArgsType()
export class DeleteManyProspectArgs {
  @TypeGraphQL.Field(_type => ProspectWhereInput, {
    nullable: true
  })
  where?: ProspectWhereInput | undefined;
}
