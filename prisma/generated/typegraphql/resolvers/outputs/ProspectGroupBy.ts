import * as TypeGraphQL from "type-graphql";
import * as GraphQLScalars from "graphql-scalars";
import { Prisma } from "@prisma/client";
import { DecimalJSScalar } from "../../scalars";
import { ProspectAvgAggregate } from "../outputs/ProspectAvgAggregate";
import { ProspectCountAggregate } from "../outputs/ProspectCountAggregate";
import { ProspectMaxAggregate } from "../outputs/ProspectMaxAggregate";
import { ProspectMinAggregate } from "../outputs/ProspectMinAggregate";
import { ProspectSumAggregate } from "../outputs/ProspectSumAggregate";
import { ProspectType } from "../../enums/ProspectType";

@TypeGraphQL.ObjectType({
  isAbstract: true
})
export class ProspectGroupBy {
  @TypeGraphQL.Field(_type => TypeGraphQL.Int, {
    nullable: false
  })
  id!: number;

  @TypeGraphQL.Field(_type => String, {
    nullable: false
  })
  externalId!: string;

  @TypeGraphQL.Field(_type => String, {
    nullable: false
  })
  url!: string;

  @TypeGraphQL.Field(_type => String, {
    nullable: false
  })
  title!: string;

  @TypeGraphQL.Field(_type => ProspectType, {
    nullable: false
  })
  type!: "TYPE_ONE" | "TYPE_TWO";

  @TypeGraphQL.Field(_type => ProspectCountAggregate, {
    nullable: true
  })
  _count!: ProspectCountAggregate | null;

  @TypeGraphQL.Field(_type => ProspectAvgAggregate, {
    nullable: true
  })
  _avg!: ProspectAvgAggregate | null;

  @TypeGraphQL.Field(_type => ProspectSumAggregate, {
    nullable: true
  })
  _sum!: ProspectSumAggregate | null;

  @TypeGraphQL.Field(_type => ProspectMinAggregate, {
    nullable: true
  })
  _min!: ProspectMinAggregate | null;

  @TypeGraphQL.Field(_type => ProspectMaxAggregate, {
    nullable: true
  })
  _max!: ProspectMaxAggregate | null;
}
