let mode = "prod"
// let mode = "dev"
// let mode = "test"

let serverURLBase =  "http://localhost:3888/"
let serverURLBase2 =  "http://localhost:3889/"

// if (mode == "prod") { serverURLBase = "http://157.230.40.169/api/" }
if (mode == "prod") { 
    serverURLBase = "https://autofarm.network/api/" 
    serverURLBase2 = "https://autofarm.network/api2/" 
}

module.exports = {
    mode,
    serverURLBase: serverURLBase,
    serverURLBase2: serverURLBase2,
    DABFarmContractAddress : mode == "test" ? "0x17f619f4eec6742cEa2d287dbbcf61Ba3360172F" : "0x68Def7d5361350eBAc92d6b9fbE672b54D68e3d5",
    DABFarmV2ContractAddress : mode == "test" ? "0x0df9c5fb57bc3b90e73563e9adb672bea2fd41fb" :  "0x0895196562c7868c5be92459fae7f877ed450452", //  "0x238a9da806bbbcf4605b8051e01d28c96450e4ab", // "0x25f9b77ef2d13d16fd0f5bdb3f84df82ba00a89e",

    DABAddress: mode == "test" ? "0xD2653285774F448fD4A2E0A3F165C453ff848cEb": "0x4508ABB72232271e452258530D4Ed799C685eccb",
    DABAddress: mode == "test" ? "0xD2653285774F448fD4A2E0A3F165C453ff848cEb": "0xa184088a740c695e156f91f5cc086a06bb78b827",

    // DABAddress: mode == "test" ? "0xD2653285774F448fD4A2E0A3F165C453ff848cEb": "0x4508ABB72232271e452258530D4Ed799C685eccb",

    gasLimit: "580000",
    blockExplorerURLBase: "https://bscscan.com/",
}