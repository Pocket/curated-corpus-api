import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { ProspectCreateInput } from "../../../inputs/ProspectCreateInput";
import { ProspectUpdateInput } from "../../../inputs/ProspectUpdateInput";
import { ProspectWhereUniqueInput } from "../../../inputs/ProspectWhereUniqueInput";

@TypeGraphQL.ArgsType()
export class UpsertProspectArgs {
  @TypeGraphQL.Field(_type => ProspectWhereUniqueInput, {
    nullable: false
  })
  where!: ProspectWhereUniqueInput;

  @TypeGraphQL.Field(_type => ProspectCreateInput, {
    nullable: false
  })
  create!: ProspectCreateInput;

  @TypeGraphQL.Field(_type => ProspectUpdateInput, {
    nullable: false
  })
  update!: ProspectUpdateInput;
}
