import { withContentlayer } from "next-contentlayer";

export default withContentlayer({
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
});
