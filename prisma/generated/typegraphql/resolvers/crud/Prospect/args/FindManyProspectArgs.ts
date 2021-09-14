import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { ProspectOrderByInput } from "../../../inputs/ProspectOrderByInput";
import { ProspectWhereInput } from "../../../inputs/ProspectWhereInput";
import { ProspectWhereUniqueInput } from "../../../inputs/ProspectWhereUniqueInput";
import { ProspectScalarFieldEnum } from "../../../../enums/ProspectScalarFieldEnum";

@TypeGraphQL.ArgsType()
export class FindManyProspectArgs {
  @TypeGraphQL.Field(_type => ProspectWhereInput, {
    nullable: true
  })
  where?: ProspectWhereInput | undefined;

  @TypeGraphQL.Field(_type => [ProspectOrderByInput], {
    nullable: true
  })
  orderBy?: ProspectOrderByInput[] | undefined;

  @TypeGraphQL.Field(_type => ProspectWhereUniqueInput, {
    nullable: true
  })
  cursor?: ProspectWhereUniqueInput | undefined;

  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: true
  })
  take?: number | undefined;

  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: true
  })
  skip?: number | undefined;

  @TypeGraphQL.Field(_type => [ProspectScalarFieldEnum], {
    nullable: true
  })
  distinct?: Array<"id" | "externalId" | "url" | "title" | "type"> | undefined;
}
