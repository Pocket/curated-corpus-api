import { UserInputError } from 'apollo-server';
import { ApolloServer } from 'apollo-server-express';
import { Request } from 'express';
import { buildSubgraphSchema } from '@apollo/subgraph';
import { typeDefsAdmin } from '../typeDefs';
import { resolvers as resolversAdmin } from './resolvers';
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import { GraphQLRequestContext } from 'apollo-server-types';
import { errorHandler, sentryPlugin } from '@pocket-tools/apollo-utils';
import { ContextManager } from './context';
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
} from 'apollo-server-core';

// Function signature for context creator; primarily for
// injecting test contexts
interface ContextFactory {
  (req: Request): ContextManager;
}
/**
 * Sets up and configures an ApolloServer for the application.
 * @param contextFactory function for creating the context with
 * every request
 * @returns ApolloServer
 */
export function getServer(contextFactory: ContextFactory): ApolloServer {
  return new ApolloServer({
    schema: buildSubgraphSchema({
      typeDefs: typeDefsAdmin,
      resolvers: resolversAdmin,
    }),
    plugins: [
      // Copied from Apollo docs, the sessionID signifies if we should separate out caches by user.
      responseCachePlugin({
        // https://www.apollographql.com/docs/apollo-server/performance/caching/#saving-full-responses-to-a-cache
        // The user id is added to the request header by the apollo gateway (client api)
        sessionId: (requestContext: GraphQLRequestContext) =>
          requestContext?.request?.http?.headers?.has('userId')
            ? requestContext?.request?.http?.headers?.get('userId')
            : null,
      }),
      sentryPlugin,
      // Keep the settings we had when using v.2:
      // no landing page on production + playground in other environments
      process.env.NODE_ENV === 'production'
        ? ApolloServerPluginLandingPageDisabled()
        : ApolloServerPluginLandingPageGraphQLPlayground(),
    ],
    context: ({ req }) => contextFactory(req),
    formatError: (error) => {
      // what in the heckaroonie is this? why can't we just do:
      //
      // formatError: errorHandler
      //
      // sit down by the fire weary traveler, and let me tell you a tale...
      //
      // once upon a time there was a devious and tricky beast. where this beast came
      // from was never fully known, but rumors spread it had arisen from the
      // dark land of Legacy Support. the true name of this fiend cannot be spoken
      // by the human tongue, but in common it is simply referred to as the Import
      // Triad of Doom. steel yourself dear traveler, and gaze thine eyes upon an
      // image of this fiend:
      //
      // import { UserInputError } from 'apollo-server';
      // import { UserInputError } from 'apollo-server-core';
      // import { UserInputError } from 'apollo-server-errors';
      //
      // three bodies, all *functionally* the same. gasp!
      //
      // with pure and perhaps foolish intent, in order to better understand the
      // beast, i snuck upon it as it slept and with the utmost quiet cast `instanceOf`.
      // dear traveler, it pains me to tell you that while the spell worked, my
      // stealth check failed! the incantation revealed the beast to be different
      // demons from parallel planes, somehow conjoined into a single monstrosity!
      //
      // the creature then awoke, and with a single wave of a hand, cast me into the
      // hidden dungeon that is errors thrown directly from a graphql schema
      // violation. battered and low on HP from a three day journey to track the
      // fiend, there i lay, too weary to move.
      //
      // as the light faded and my eyes grew heavy, a silhouette emerged at the
      // mouth of the dungeon. could it be? is it...? yes? YES! my long-time
      // comrade, slayer of many a foe, the great kelvin!
      //
      // half conscious, kelvin sat me up and offered waterskin and lambas bread.
      // "stay here, i will go on to discover the secret of this dungeon and return
      // for you."
      //
      // time held no meaning for me then. my only energy spent carefully chewing
      // and drinking, fading in and out between nourishments. darkness washed over
      // me.
      //
      // as promised, kelvin returned.
      //
      // "the riddle has been solved. when a graphql schema violation occurs, the great
      // apollo itself is cruelly conjuring `UserInputError` from `apollo-server`
      // of the forsaken land of Legacy Support. yes, the same origin of the hideous
      // Import Triad of Doom. sometimes, even the gods make mistakes."
      //
      // kelvin then showed me the below wrapper spell, which accounts for the mistakes
      // of the gods, until they should find time to fix them.
      //
      // the beast lives on to this day, contained, yet still dangerous to those
      // unfortunate enough to cross its path.
      //
      // be wary, traveler, and double-check your imports.
      //
      // ~ fin
      //
      // the moral of the story:
      //
      // in our `apollo-utils` `errorHandler`, we are checking `instanceOf ApolloError`,
      // with `ApolloError` imported from the recommended `apollo-server-errors`
      // package. (see the source:
      // https://github.com/Pocket/apollo-utils/blob/main/src/errorHandler/errorHandler.ts#L10-L24))
      //
      // however, when a graphql schema violation occurs, apollo is throwing a
      // `UserInputError`, which is what we expect, but they are importing this error
      // from `apollo-server`, which causes our `instanceOf` check to fail.
      //

      // check to see if the error came from a graphql schema violation (see above)
      if (error instanceof UserInputError) {
        // if so, we are safe to pass it through to clients
        return error;
      } else {
        // otherwise, send the error to our error handler
        return errorHandler(error);
      }
    },
  });
}

/**
 * Create and start the apollo server. Required to await server.start()
 * before applying middleware per apollo-server 3 migration.
 */
export async function startServer(
  contextFactory: ContextFactory
): Promise<ApolloServer> {
  const server = getServer(contextFactory);
  await server.start();
  return server;
}
