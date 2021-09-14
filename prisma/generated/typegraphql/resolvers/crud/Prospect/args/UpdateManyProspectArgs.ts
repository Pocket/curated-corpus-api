import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { ProspectUpdateManyMutationInput } from "../../../inputs/ProspectUpdateManyMutationInput";
import { ProspectWhereInput } from "../../../inputs/ProspectWhereInput";

@TypeGraphQL.ArgsType()
export class UpdateManyProspectArgs {
  @TypeGraphQL.Field(_type => ProspectUpdateManyMutationInput, {
    nullable: false
  })
  data!: ProspectUpdateManyMutationInput;

  @TypeGraphQL.Field(_type => ProspectWhereInput, {
    nullable: true
  })
  where?: ProspectWhereInput | undefined;
}
