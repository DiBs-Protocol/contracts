export const testAppId =
  "45810160343022089601028851206408642627529628329831086458846511772841706178168";
export const testOwner = {
  owner: "0x8719994FC15A75ADf32F464FCb0BD5Ea990Bb64c",
  ownerPubKey: {
    x: "0x7f3311d18bfb339aa17b5223e5ec926ff275839aa745a1de85cfb82c30afde2d",
    yParity: "1",
  },
};

export const testGwAddress = "0xD8A03762CCb7d5b22034b555D13371d2A15F7854";

export const testClaimSig = {
  success: true,
  result: {
    confirmed: true,
    reqId: "0xe7d15e482ad18f62b90f80d5e1dad69d9347b21ccb63603153e5301a12897462",
    app: "dibs",
    appId:
      "29503600283749605679892442018301974903747905228367523023427374612996254935333",
    method: "claim",
    nSign: 3,
    gwAddress: "0xD8A03762CCb7d5b22034b555D13371d2A15F7854",
    data: {
      uid: "1gjm4lk8al59npp",
      params: {
        user: "0x04874d4087e3f611ac555d4bc1f5bed7bd8b45a0",
        token: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
      },
      timestamp: 1670411637,
      result: {
        user: "0x04874d4087e3f611ac555d4bc1f5bed7bd8b45a0",
        token: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
        balance: "30000000000",
      },
      signParams: [
        {
          name: "appId",
          type: "uint256",
          value:
            "29503600283749605679892442018301974903747905228367523023427374612996254935333",
        },
        {
          name: "reqId",
          type: "uint256",
          value:
            "0xe7d15e482ad18f62b90f80d5e1dad69d9347b21ccb63603153e5301a12897462",
        },
        {
          type: "address",
          value: "0x04874d4087e3f611ac555d4bc1f5bed7bd8b45a0",
        },
        {
          type: "address",
          value: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
        },
        { type: "uint256", value: "30000000000" },
      ],
      init: { nonceAddress: "0x8d358568e2D21930E760e5Bf21595270Ee5Fe1c4" },
    },
    startedAt: 1670411637,
    confirmedAt: 1670411638,
    gwSignature:
      "0x0f94a7eb5accad092654621ba6b53cb215161efb4877527ba2c774914f99368675dd86bad9491de496934dda596bacc83042cee48ec9a619df1317c84780b66c1c",
    signatures: [
      {
        owner: "0x21bac708eeCe20a1bb5e7181E27d503Abc13feF4",
        ownerPubKey: {
          x: "0x379959bf1fbef59a158f862092cc41541ef40915ab7aa90b9eb08a979e54efc4",
          yParity: "1",
        },
        timestamp: 1670411638,
        result: {
          user: "0x04874d4087e3f611ac555d4bc1f5bed7bd8b45a0",
          token: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
          balance: "30000000000",
        },
        signature:
          "0xba9d4e120c11cd2638ea5cc857a6bc61f2873e3723d2ef39c16ad3f8e29aa71b",
      },
    ],
    cid: "f017012203003b8ebec8d8d540e36719f9a98132f434f346061d3d8a2c7f49b17874bd1e5",
  },
};
export let testRounWinnerSig = {
  success: true,
  result: {
    confirmed: true,
    reqId: "0xd3294bd5f29fbea43cb02442754dfa9f43d9e8ed2a0f51ca2965cbbf4c7ee969",
    app: "dibs",
    appId:
      "29503600283749605679892442018301974903747905228367523023427374612996254935333",
    method: "winner",
    nSign: 3,
    gwAddress: "0xD8A03762CCb7d5b22034b555D13371d2A15F7854",
    data: {
      uid: "1gjm4m1utobk3j1",
      params: { roundId: "8" },
      timestamp: 1670411651,
      result: {
        roundId: "8",
        winner: "0x9b745da58c0b08018766d96d3bd930f379f94bd8",
      },
      signParams: [
        {
          name: "appId",
          type: "uint256",
          value:
            "29503600283749605679892442018301974903747905228367523023427374612996254935333",
        },
        {
          name: "reqId",
          type: "uint256",
          value:
            "0xd3294bd5f29fbea43cb02442754dfa9f43d9e8ed2a0f51ca2965cbbf4c7ee969",
        },
        { type: "uint32", value: "8" },
        {
          type: "address",
          value: "0x9b745da58c0b08018766d96d3bd930f379f94bd8",
        },
      ],
      init: { nonceAddress: "0xAB5bD82b55F98c28460601ef37aF66fF1961Fac6" },
    },
    startedAt: 1670411651,
    confirmedAt: 1670411653,
    gwSignature:
      "0x7ac4bee3a682a7cf04e0c7bf81bbac24f56deed94822a8c7c59fdfc9d23848b0645f9086614ed8ebac477ac55ed72947267384ede0d9af80656d6f32e00fe10a1b",
    signatures: [
      {
        owner: "0x21bac708eeCe20a1bb5e7181E27d503Abc13feF4",
        ownerPubKey: {
          x: "0x379959bf1fbef59a158f862092cc41541ef40915ab7aa90b9eb08a979e54efc4",
          yParity: "1",
        },
        timestamp: 1670411653,
        result: {
          roundId: "8",
          winner: "0x9b745da58c0b08018766d96d3bd930f379f94bd8",
        },
        signature:
          "0xeba6b29dccfe7660f13360189c7a281b43ea00737e577faac8f5007c41c39c1b",
      },
    ],
    cid: "f01701220142b94d965fd720971c1bab55f952c789d660ebd695741355041eaf936dc4bab",
  },
};
export const testTss = {
  success: true,
  result: {
    confirmed: true,
    reqId: "0x5614a0df694c1b34fc2926b8d8f013413dca5e3767790596c7c9626b64c90769",
    app: "tss",
    appId:
      "45810160343022089601028851206408642627529628329831086458846511772841706178168",
    method: "test",
    nSign: 2,
    gwAddress: "0xD8A03762CCb7d5b22034b555D13371d2A15F7854",
    data: {
      uid: "1gjm3uqog7srfoq",
      params: {},
      timestamp: 1670410890,
      result: "done",
      signParams: [
        {
          name: "appId",
          type: "uint256",
          value:
            "45810160343022089601028851206408642627529628329831086458846511772841706178168",
        },
        {
          name: "reqId",
          type: "uint256",
          value:
            "0x5614a0df694c1b34fc2926b8d8f013413dca5e3767790596c7c9626b64c90769",
        },
        { type: "string", value: "done" },
      ],
      init: { nonceAddress: "0x4A4584B41Ff33870405bcA9CCA11089d85Fd029e" },
    },
    startedAt: 1670410890,
    confirmedAt: 1670410890,
    signatures: [
      {
        owner: "0x8719994FC15A75ADf32F464FCb0BD5Ea990Bb64c",
        ownerPubKey: {
          x: "0x7f3311d18bfb339aa17b5223e5ec926ff275839aa745a1de85cfb82c30afde2d",
          yParity: "1",
        },
        timestamp: 1670410890,
        result: "done",
        signature:
          "0xe4275cf1f3f9c64edd41bbc03986f4934c4c171f5b95386da5d5cbe9a58ba467",
      },
    ],
    cid: "f0170122065300657f41e6265873abac0477a1880f7408c5b768a346814167a423175d429",
  },
};

export const testTss2 = {
  success: true,
  result: {
    confirmed: true,
    reqId: "0x33cc5b2833c0b6d54b93675e2cb8f8a3696455002f1939d856d8246dd8cecdf5",
    app: "tss",
    appId:
      "45810160343022089601028851206408642627529628329831086458846511772841706178168",
    method: "test",
    nSign: 2,
    gwAddress: "0xD8A03762CCb7d5b22034b555D13371d2A15F7854",
    data: {
      uid: "1gjm42e0obhn537",
      params: {},
      timestamp: 1670411008,
      result: "done",
      signParams: [
        {
          name: "appId",
          type: "uint256",
          value:
            "45810160343022089601028851206408642627529628329831086458846511772841706178168",
        },
        {
          name: "reqId",
          type: "uint256",
          value:
            "0x33cc5b2833c0b6d54b93675e2cb8f8a3696455002f1939d856d8246dd8cecdf5",
        },
        { type: "string", value: "done" },
      ],
      init: { nonceAddress: "0x506e12b5cF726541cd6095489E73a9F37C2Bdd5D" },
    },
    startedAt: 1670411008,
    confirmedAt: 1670411008,
    signatures: [
      {
        owner: "0xdf1575d431E7EF5F80EE7A9d95fA7517956c763F",
        ownerPubKey: {
          x: "0x2cfc0246f89d622c0242ee0762392f500a2bc25d401daf6876974d3882705a64",
          yParity: "1",
        },
        timestamp: 1670411008,
        result: "done",
        signature:
          "0x10c40146dbb2fdf780568b05ad98ffe08a64067c37279abdf86f8a1a34ffe517",
      },
    ],
    cid: "f01701220180ec5dc9ac3e0e2fe6c78db30e99bc4ae320760cbad3b7f4a0a9fc084c09c2d",
  },
};

export const testTss3 = {
  success: true,
  result: {
    confirmed: true,
    reqId: "0x8698548f6628a50001cd8ec3f22bd35bd134504638a8d0b276758920283d2977",
    app: "tss",
    appId:
      "45810160343022089601028851206408642627529628329831086458846511772841706178168",
    method: "test",
    nSign: 2,
    gwAddress: "0xD8A03762CCb7d5b22034b555D13371d2A15F7854",
    data: {
      uid: "1gjm45o86obj84t",
      params: {},
      timestamp: 1670411116,
      result: "done",
      signParams: [
        {
          name: "appId",
          type: "uint256",
          value:
            "45810160343022089601028851206408642627529628329831086458846511772841706178168",
        },
        {
          name: "reqId",
          type: "uint256",
          value:
            "0x8698548f6628a50001cd8ec3f22bd35bd134504638a8d0b276758920283d2977",
        },
        { type: "string", value: "done" },
      ],
      init: { nonceAddress: "0x378F15Dc245279A200a0404F105D9AC37936Ad97" },
    },
    startedAt: 1670411116,
    confirmedAt: 1670411117,
    signatures: [
      {
        owner: "0x5264E4c037b632962a713F4Db4c23AC6B8102D79",
        ownerPubKey: {
          x: "0x3b57dca58c48605b61a5567ffbb8eaef9e6304a2dd052620a6b87d83a82526c7",
          yParity: "1",
        },
        timestamp: 1670411117,
        result: "done",
        signature:
          "0xb926f145ca2c91cab8a354bc39b95e5fda90e9dc1348f6bfb6360cf836ec8d1c",
      },
    ],
    cid: "f01701220a4162bf3377e5862df51e98a7673920395a2b5125d8f6d73574e2c7f47724310",
  },
};

export const testTss4 = {
  success: true,
  result: {
    confirmed: true,
    reqId: "0x0b39083d4961c8b52adeabaf5685b0ae95dd9d2f5c16c77354c77d3ec15aad2e",
    app: "tss",
    appId:
      "45810160343022089601028851206408642627529628329831086458846511772841706178168",
    method: "test",
    nSign: 2,
    gwAddress: "0xD8A03762CCb7d5b22034b555D13371d2A15F7854",
    data: {
      uid: "1gjm49njjt8uk95",
      params: {},
      timestamp: 1670411247,
      result: "done",
      signParams: [
        {
          name: "appId",
          type: "uint256",
          value:
            "45810160343022089601028851206408642627529628329831086458846511772841706178168",
        },
        {
          name: "reqId",
          type: "uint256",
          value:
            "0x0b39083d4961c8b52adeabaf5685b0ae95dd9d2f5c16c77354c77d3ec15aad2e",
        },
        { type: "string", value: "done" },
      ],
      init: { nonceAddress: "0x40dEb0D2122f3426ec825117bA40a65F47674C5D" },
    },
    startedAt: 1670411247,
    confirmedAt: 1670411247,
    signatures: [
      {
        owner: "0x67120741Ce9248A77862371EbC3A63CB6b0bB332",
        ownerPubKey: {
          x: "0x6dc554f4d8962a47355a3cf5c72b1740edfd3cf6af477148b5e9430bba90acb6",
          yParity: "0",
        },
        timestamp: 1670411247,
        result: "done",
        signature:
          "0xe5f843f2c14c7202cf7b23f4135a181697d8b6a246f673822b04d27c960f2489",
      },
    ],
    cid: "f01701220aeaa4fad6198b705afe37b952e1df7be3889095fd5cf2cdc1f9bec45c2abd217",
  },
};

export const leaderBoardWinnersSing = {
  success: true,
  result: {
    confirmed: true,
    reqId: "0x3bf22b162554062f82be1e3f5e5c389c3133ddd4c4164b0b609fc52e6101f282",
    app: "dibs",
    appId:
      "29503600283749605679892442018301974903747905228367523023427374612996254935333",
    method: "topN",
    nSign: 7,
    gwAddress: "0xf56b6C94F17fe81023a31cb6FAa2592c49292215",
    data: {
      uid: "1gpf4ad74i6f9u0",
      params: {
        day: "23",
        n: "8",
      },
      timestamp: 1676618839,
      result: {
        n: "8",
        day: "23",
        topN: [
          "0x4bb12cc382e36b4b6faf7bdca7708969aed258ef",
          "0x64c174d4d18be87555bc56ddcd8b71912a4c1811",
          "0x69d3158a17e11fbbdb2a0e7e8bd05ac3628e3630",
          "0x3c9ff2b8ff27c1cb882e9e350d83fb8ac6d647a3",
          "0x1de1ecbb8db25752d52c346aa4eeb9359ab5886e",
          "0x664ce330511653cb2744b8ed50dba31c6c4c08ca",
          "0x2f45724d7e384b38d5c97206e78470544304887f",
          "0x70aa309d485950c0c247be3391d0be621639a380",
        ],
      },
      signParams: [
        {
          name: "appId",
          type: "uint256",
          value:
            "29503600283749605679892442018301974903747905228367523023427374612996254935333",
        },
        {
          name: "reqId",
          type: "uint256",
          value:
            "0x3bf22b162554062f82be1e3f5e5c389c3133ddd4c4164b0b609fc52e6101f282",
        },
        {
          type: "uint256",
          value: "8",
        },
        {
          type: "uint256",
          value: "23",
        },
        {
          type: "address[]",
          value: [
            "0x4bb12cc382e36b4b6faf7bdca7708969aed258ef",
            "0x64c174d4d18be87555bc56ddcd8b71912a4c1811",
            "0x69d3158a17e11fbbdb2a0e7e8bd05ac3628e3630",
            "0x3c9ff2b8ff27c1cb882e9e350d83fb8ac6d647a3",
            "0x1de1ecbb8db25752d52c346aa4eeb9359ab5886e",
            "0x664ce330511653cb2744b8ed50dba31c6c4c08ca",
            "0x2f45724d7e384b38d5c97206e78470544304887f",
            "0x70aa309d485950c0c247be3391d0be621639a380",
          ],
        },
      ],
      init: {
        nonceAddress: "0x8cb7Cdbd170D47A40e1DA570011c066CD56CA123",
      },
    },
    startedAt: 1676618839,
    confirmedAt: 1676618848,
    signatures: [
      {
        owner: "0x7f3a2F1C35A585f59ec8eaB66b53572519c9A8C2",
        ownerPubKey: {
          x: "0x7d9967f214b8d6f4fca8a49c076d52213395771fe976901869ebf77b42b123a1",
          yParity: "1",
        },
        timestamp: 1676618848,
        signature:
          "0x2dbaaae59220a95408fad4cf2cc499315eb026abbbe5f041f4494ba0acbea267",
      },
    ],
    shieldAddress: "0x6914c3AF649c285d706d6757DD899D84B606c2dA",
    shieldSignature:
      "0x6f3c9d62a6c124e39f5be70f4c3f37e026a1c00f77882420b0da462490d626235cfebcaa0f20f3c5d87890b18b0ffbf23ec63bfd8f51d1f1d9f042706fbff0731b",
    nodeSignature:
      "0x6f3c9d62a6c124e39f5be70f4c3f37e026a1c00f77882420b0da462490d626235cfebcaa0f20f3c5d87890b18b0ffbf23ec63bfd8f51d1f1d9f042706fbff0731b",
  },
};
