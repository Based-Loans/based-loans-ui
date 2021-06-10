export const ZERO = '0x0000000000000000000000000000000000000000'

export const addresses = {
  1: {
    Farms: [
      {
        title: 'Based.Money (Moonbase)',
        asset: 'mbBased', // USDC
        contractAddress: '0x62cA8C27493AfF0b7589c249B371f1Ed6680484c',
        website: 'MoonBase',
        websiteUrl: 'https://moon.based.money/',
        market: 'SushiSwap',
        marketUrl:
          'https://exchange.sushi.com/#/swap?outputCurrency=0x26cF82e4aE43D31eA51e72B663d26e26a75AF729',
        totalDistribution: '35000000',
        underlyingAddress: '0x26cf82e4ae43d31ea51e72b663d26e26a75af729',
        underlyingDecimals: 18,
        rewardAsset: 'BLO',
      },
      {
        title: 'Compound Finance',
        asset: 'Comp', // WBTC
        contractAddress: '0xd094742Fc277304Fc42a77636cd15EA7DA617F74',
        website: 'Compound',
        websiteUrl: 'https://compound.finance/',
        market: 'Uniswap',
        marketUrl:
          'https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=0xc00e94cb662c3520282e6f5717214004a7f26888',
        totalDistribution: '12000000',
        underlyingAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888',
        underlyingDecimals: 18,
        rewardAsset: 'BLO',
      },
    ],
    Comp: '0x68481f2c02BE3786987ac2bC3327171C5D05F9Bd',
    CompoundLens: '0xfcb1281A5dC7311b07226ACC5fC934A6c68FcbC2',
    Comptroller: '0x4E286EC4EEB52F4bEDFa997A9F45c9cd3D932d89',
    DAIInterestRateModelV3: '0xa25B42AEbFDff6A872DD1031dCfCAb3DeC39dFee',
    HQLAModel: '0x34F48baa7cD90F9a95e8D3468B4968Fa9Bbf3703',
    OADefaultModel: '0x32BeaD30E08f3864Bb8F5bEA58387dA2706A1bd7',
    OAHighJumpModel: '0xF4c04b5699A05FF7eDF3edb86A7F02d7170CE413',
    UniswapAnchoredView: '0xc927Bb20a93AC337061DA5075aAf74154Fa38AdB',
    Unitroller: '0xa7Fe9D6c783f6c121b0c3823b71B73c9bf1C9f94',
  },
  4: {
    Farms: [
      {
        title: 'Based.Money (Moonbase)',
        asset: 'mbBased', // USDC
        contractAddress: '0x97443C5365654B0e82764FeFC9118f86437B0aB6',
        website: 'MoonBase',
        websiteUrl: 'https://moon.based.money/',
        market: 'SushiSwap',
        marketUrl:
          'https://exchange.sushi.com/#/swap?outputCurrency=0x26cF82e4aE43D31eA51e72B663d26e26a75AF729',
        totalDistribution: '35000000',
        underlyingAddress: '0xeb8f08a975ab53e34d8a0330e0d34de942c95926',
        underlyingDecimals: 6,
        rewardAsset: 'BLO',
      },
      {
        title: 'Compound Finance',
        asset: 'Comp', // WBTC
        contractAddress: '0x7fACdeaF25570Ba03aa5149a1E362De6496986B8',
        website: 'Compound',
        websiteUrl: 'https://compound.finance/',
        market: 'Uniswap',
        marketUrl:
          'https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=0xc00e94cb662c3520282e6f5717214004a7f26888',
        totalDistribution: '12000000',
        underlyingAddress: '0xb480c498f33a664dd43ffab82d9c49b073db8b2c',
        underlyingDecimals: 8,
        rewardAsset: 'BLO',
      },
    ],
    Comp: '0x85DDcceFe0eaDF28770A61CC7882e545aD396f0e',
    CompoundLens: '0xF8937f70Cf278c5c64716E46A2a94f1317fea8bd',
    Comptroller: '0x9e6926fA449544513C010aAC489Ba613D2589FC3',
    DAIInterestRateModelV3: '0xE2150D06057Bccf47873F2e6b9925BFE8843a0dE',
    HQLAModel: '0xbA2DA89893Aa052D99c19019729712d30Da50809',
    OADefaultModel: '0xa5098e913d8e8F503d320920d480E2eE0F3aD20C',
    OAHighJumpModel: '0x513b85F28B5c0867bEb3368B4924582f176d88Bc',
    UniswapAnchoredView: '0x14bb241DAEa2488b8A218b6739E1b8c01cd5c903',
    Unitroller: '0x3c1b9C502F8ae4B1cF90248dE582d0C6c1E3c702',
  },
  137: {
    Farms: [],
    Comp: ZERO,
    CompoundLens: ZERO,
    Comptroller: ZERO,
    HQLAModel: ZERO,
    OADefaultModel: ZERO,
    OAHighJumpModel: ZERO,
    UniswapAnchoredView: ZERO,
    Unitroller: ZERO,
  },
}
