import nextConfig from "eslint-config-next";

const eslintConfig = [...nextConfig, { ignores: [".claude/**", "supabase/**"] }];

export default eslintConfig;
