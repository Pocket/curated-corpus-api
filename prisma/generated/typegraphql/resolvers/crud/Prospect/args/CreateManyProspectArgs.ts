import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { ProspectCreateManyInput } from "../../../inputs/ProspectCreateManyInput";

@TypeGraphQL.ArgsType()
export class CreateManyProspectArgs {
  @TypeGraphQL.Field(_type => [ProspectCreateManyInput], {
    nullable: false
  })
  data!: ProspectCreateManyInput[];

  @TypeGraphQL.Field(_type => Boolean, {
    nullable: true
  })
  skipDuplicates?: boolean | undefined;
}
