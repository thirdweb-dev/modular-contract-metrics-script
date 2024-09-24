import { computePublishedContractAddress } from "thirdweb/deploys";
import { sepolia } from "thirdweb/chains";
import dedent from "dedent";
import { createThirdwebClient } from "thirdweb";
import "dotenv/config";

const clientId = process.env.CLIENT_ID!;
const secret = process.env.SECRET!;

const client = createThirdwebClient({
  // use `secretKey` for server side or script usage
  secretKey: secret,
});

const erc20 = [
  "ClaimableERC20",
  "MintableERC20",
  "TransferableERC20",
  "CreatorTokenERC20",
];

const erc721 = [
  "BatchMetadataERC721",
  "ClaimableERC721",
  "MintableERC721",
  "OpenEditionMetadataERC721",
  "RoyaltyERC721",
  "TransferableERC721"
];

const erc1155 = [
  "BatchMetadataERC1155",
  "ClaimableERC1155",
  "MintableERC1155",
  "OpenEditionMetadataERC1155",
  "RoyaltyERC1155",
  "TransferableERC1155",
  "SequentialTokenIdERC1155",
];

const moduleInstalledTopic0 = "0xbcd03fe408dcc45614e803cbab9f500dddff61b17380b993e76d30398da47229"
const moduleUninstalledTopic0 = "0xef3b2e20acbb62d61d782c5449bd73d3970cb9be1050a6ad6f846b2cbe21c03a"

const queryTemplate = (filters: string, topic0: string) => dedent`
  SELECT 
  ${filters} 
  FROM logs 
  WHERE topic_0 = '${topic0}';
`

const countFilterTemplate = (contract: string, module: string) => `countIf(data LIKE '%${contract}') AS ${module},`;

const getAddress = (module: string) => computePublishedContractAddress({
  client,
  chain: sepolia,
  contractId: module,
});

const getErcFilters = (erc: string[]) => Promise.all(erc.map(async (module) => {
  const address = await getAddress(module);
  return countFilterTemplate(address.slice(2), module)
}))

async function main() {
  const erc20Filters = (await getErcFilters(erc20)).join("\n");
  const erc721Filters = (await getErcFilters(erc721)).join("\n");
  const erc1155Filters = (await getErcFilters(erc1155)).join("\n");

  const moduleInstalledErc20 = queryTemplate(erc20Filters, moduleInstalledTopic0);
  const moduleInstalledErc721 = queryTemplate(erc721Filters, moduleInstalledTopic0);
  const moduleInstalledErc1155 = queryTemplate(erc1155Filters, moduleInstalledTopic0);

  const moduleUninstalledErc20 = queryTemplate(erc20Filters, moduleUninstalledTopic0);
  const moduleUninstalledErc721 = queryTemplate(erc721Filters, moduleUninstalledTopic0);
  const moduleUninstalledErc1155 = queryTemplate(erc1155Filters, moduleUninstalledTopic0);

  console.log(moduleInstalledErc20);
  console.log();
  console.log(moduleInstalledErc721);
  console.log();
  console.log(moduleInstalledErc1155);
  console.log();

  console.log(moduleUninstalledErc20);
  console.log();
  console.log(moduleUninstalledErc721);
  console.log();
  console.log(moduleUninstalledErc1155);
  console.log();
}

main()
