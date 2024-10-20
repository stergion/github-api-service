import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
    schema: "src/graphql/schema.docs.graphql",
    documents: ["src/graphql/queries/**/*.gql.ts"],
    generates: {
        "./src/__generated__/": {
            preset: "client",
            presetConfig: {
                gqlTagName: "gql",
              },
        },
      },
};

export default config;