import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "@prisma/client";
import { DecimalJSScalar } from "../../scalars";
import { EnumProspectTypeFilter } from "../inputs/EnumProspectTypeFilter";
import { IntFilter } from "../inputs/IntFilter";
import { StringFilter } from "../inputs/StringFilter";

@TypeGraphQL.InputType({
  isAbstract: true
})
export class ProspectWhereInput {
  @TypeGraphQL.Field(_type => [ProspectWhereInput], {
    nullable: true
  })
  AND?: ProspectWhereInput[] | undefined;

  @TypeGraphQL.Field(_type => [ProspectWhereInput], {
    nullable: true
  })
  OR?: ProspectWhereInput[] | undefined;

  @TypeGraphQL.Field(_type => [ProspectWhereInput], {
    nullable: true
  })
  NOT?: ProspectWhereInput[] | undefined;

  @TypeGraphQL.Field(_type => IntFilter, {
    nullable: true
  })
  id?: IntFilter | undefined;

  @TypeGraphQL.Field(_type => StringFilter, {
    nullable: true
  })
  externalId?: StringFilter | undefined;

  @TypeGraphQL.Field(_type => StringFilter, {
    nullable: true
  })
  url?: StringFilter | undefined;

  @TypeGraphQL.Field(_type => StringFilter, {
    nullable: true
  })
  title?: StringFilter | undefined;

  @TypeGraphQL.Field(_type => EnumProspectTypeFilter, {
    nullable: true
  })
  type?: EnumProspectTypeFilter | undefined;
}
