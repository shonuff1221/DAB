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
    
    DABFarmContractAddress : mode == "test" ? "0xb29CF744f4Cf5a3C245e1bEDe4749B88895a87BE" :  "0x12E8613F1d980FD0543ECEBB2dab9533C589250F", //  "0x238a9da806bbbcf4605b8051e01d28c96450e4ab", // "0x25f9b77ef2d13d16fd0f5bdb3f84df82ba00a89e",

    DABAddress: mode == "test" ? "0x1dd3f989d9FD178388Ef1D67e5E84B92B517125E": "0x12E8613F1d980FD0543ECEBB2dab9533C589250F",
    DABAddress: mode == "test" ? "0xD2653285774F448fD4A2E0A3F165C453ff848cEb": "0x12E8613F1d980FD0543ECEBB2dab9533C589250F",

    // DABAddress: mode == "test" ? "0xD2653285774F448fD4A2E0A3F165C453ff848cEb": "0x4508ABB72232271e452258530D4Ed799C685eccb",

    gasLimit: "580000",
    blockExplorerURLBase: "https://bscscan.com/",
}