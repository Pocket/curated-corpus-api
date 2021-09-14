import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { ProspectUpdateInput } from "../../../inputs/ProspectUpdateInput";
import { ProspectWhereUniqueInput } from "../../../inputs/ProspectWhereUniqueInput";

@TypeGraphQL.ArgsType()
export class UpdateProspectArgs {
  @TypeGraphQL.Field(_type => ProspectUpdateInput, {
    nullable: false
  })
  data!: ProspectUpdateInput;

  @TypeGraphQL.Field(_type => ProspectWhereUniqueInput, {
    nullable: false
  })
  where!: ProspectWhereUniqueInput;
}
