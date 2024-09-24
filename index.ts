import { computePublishedContractAddress } from "thirdweb/deploys";
import { sepolia } from "thirdweb/chains";
import dedent from "dedent";
import { createThirdwebClient } from "thirdweb";
import "dotenv/config";

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

const allModules = [...erc20, ...erc721, ...erc1155];

const moduleInstalledTopic0 = "0xbcd03fe408dcc45614e803cbab9f500dddff61b17380b993e76d30398da47229"
const moduleUninstalledTopic0 = "0xef3b2e20acbb62d61d782c5449bd73d3970cb9be1050a6ad6f846b2cbe21c03a"
const installModuleTableName = 'install_module_logs'
const uninstallModuleTableName = 'uninstall_module_logs'

const tableTemplate = (name: string, topic0: string) => dedent`
WITH ${name} AS (
    SELECT
        chain_id, data
    FROM logs
    WHERE chain_id IN (137, 11155111, 8453, 42161, 43113, 660279, 534352, 59144, 7777777) 
    AND topic_0 = '${topic0}'
)`

const queryTemplate = (filters: string, table: string) => dedent`
  SELECT 
  ${filters} 
  FROM ${table};
`

const countFilterTemplate = (contract: string, module: string, last: boolean) => `countIf(data LIKE '%${contract}') AS ${module}${last ? '' : ','}`;

const getAddress = (module: string) => computePublishedContractAddress({
  client,
  chain: sepolia,
  contractId: module,
});

const getErcFilters = (erc: string[]) => Promise.all(erc.map(async (module, i) => {
  const address = await getAddress(module);
  return countFilterTemplate(address.slice(2), module, i === erc.length - 1);
}))

async function typesOfModulesInstalledAndUninstalledByERC() {
  const installModuleTable = tableTemplate(installModuleTableName, moduleInstalledTopic0);
  const uninstallModuleTable = tableTemplate(uninstallModuleTableName, moduleUninstalledTopic0);

  const erc20Filters = (await getErcFilters(erc20)).join("\n");
  const erc721Filters = (await getErcFilters(erc721)).join("\n");
  const erc1155Filters = (await getErcFilters(erc1155)).join("\n");

  const moduleInstalledErc20 = queryTemplate(erc20Filters, installModuleTableName);
  const moduleInstalledErc721 = queryTemplate(erc721Filters, installModuleTableName);
  const moduleInstalledErc1155 = queryTemplate(erc1155Filters, installModuleTableName);

  const moduleUninstalledErc20 = queryTemplate(erc20Filters, uninstallModuleTableName);
  const moduleUninstalledErc721 = queryTemplate(erc721Filters, uninstallModuleTableName);
  const moduleUninstalledErc1155 = queryTemplate(erc1155Filters, uninstallModuleTableName);


  console.log(installModuleTable);
  console.log(moduleInstalledErc20);
  console.log();

  console.log(installModuleTable);
  console.log(moduleInstalledErc721);
  console.log();

  console.log(installModuleTable);
  console.log(moduleInstalledErc1155);
  console.log();

  console.log(uninstallModuleTable);
  console.log(moduleUninstalledErc20);
  console.log();

  console.log(uninstallModuleTable);
  console.log(moduleUninstalledErc721);
  console.log();

  console.log(uninstallModuleTable);
  console.log(moduleUninstalledErc1155);
  console.log();
}

// =============================================================================

const customModuleQueryTemplate = (filter: string) => dedent`
  SELECT 
    COUNT(DISTINCT(substring(data, -40)))
  FROM logs
  WHERE chain_id IN (137, 11155111, 8453, 42161, 43113, 660279, 534352, 59144, 7777777)
  ${filter}
`

const customModuleFilter = (contract: string) => `AND data NOT LIKE '%${contract}'`;

async function numberOfCustomModules() {
  const allModulesFilter = (await Promise.all(allModules.map(async (module) => {
    const address = await getAddress(module);
    return customModuleFilter(address.slice(2))
  }))).join("\n");

  const customModuleQuery = customModuleQueryTemplate(allModulesFilter);
  console.log(customModuleQuery);
}

//typesOfModulesInstalledAndUninstalledByERC();
numberOfCustomModules();
