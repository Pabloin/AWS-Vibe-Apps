export const PASS_RULES = {
  Guided: 75,
  Challenge: 60,
  Test: 0
};

export const REQUIRED_STATUS = {
  REQUIRED: "Required",
  EXTRA_POINT: "Extra Point",
  OPTIONAL: "Optional",
  NONE: ""
};

export const criteria = [
  {
    module: "M01",
    type: "Guided",
    title: "Guided Lab: Exploring AWS Identity and Access Management (IAM) (1937915)",
    required: REQUIRED_STATUS.REQUIRED,
    threshold: 75
  },
  {
    module: "M05",
    type: "Guided",
    title: "Guided lab: Introducing Amazon Elastic File System (Amazon EFS) (1937932)",
    required: REQUIRED_STATUS.REQUIRED,
    threshold: 75
  },
  {
    module: "M06",
    type: "Guided",
    title: "Guided lab: Creating an Amazon RDS Database (1937927)",
    required: REQUIRED_STATUS.REQUIRED,
    threshold: 75
  },
  {
    module: "M07",
    type: "Guided",
    title: "Guided lab: Creating a Virtual Private Cloud (1937925)",
    required: REQUIRED_STATUS.REQUIRED,
    threshold: 75
  },
  {
    module: "M08",
    type: "Guided",
    title: "Guided lab: Creating a VPC Peering Connection (1937923)",
    required: REQUIRED_STATUS.REQUIRED,
    threshold: 75
  },
  {
    module: "M09",
    type: "Guided",
    title: "Guided lab: Encrypting Data at Rest by Using AWS Encryption Options (1937929)",
    required: REQUIRED_STATUS.REQUIRED,
    threshold: 75
  },
  {
    module: "M09",
    type: "Guided",
    title: "Guided lab: Securing Applications by using Amazon Cognito (1937934)",
    required: REQUIRED_STATUS.REQUIRED,
    threshold: 75
  },
  {
    module: "M10",
    type: "Guided",
    title: "Guided lab: Creating a Highly Available Environment (1937921)",
    required: REQUIRED_STATUS.REQUIRED,
    threshold: 75
  },
  {
    module: "M11",
    type: "Guided",
    title: "Guided lab: Automating Infrastructure with AWS CloudFormation (1937917)",
    required: REQUIRED_STATUS.REQUIRED,
    threshold: 75
  },
  {
    module: "M13",
    type: "Guided",
    title: "Guided lab: Building Decoupled Applications by Using Amazon SQS (1937919)",
    required: REQUIRED_STATUS.REQUIRED,
    threshold: 75
  },
  {
    module: "M14",
    type: "Guided",
    title: "Guided lab: Implementing a Serverless Architecture on AWS (1937931)",
    required: REQUIRED_STATUS.REQUIRED,
    threshold: 75
  },
  {
    module: "M16",
    type: "Guided",
    title: "Guided Lab: Configuring Hybrid Storage and Migrating Data with AWS Storage Gateway S3 File Gateway (1937913)",
    required: REQUIRED_STATUS.REQUIRED,
    threshold: 75
  },
  {
    module: "M04",
    type: "Challenge",
    title: "Challenge (Cafe) lab: Creating a Static Website for the Cafe (1937902)",
    required: REQUIRED_STATUS.REQUIRED,
    threshold: 60
  },
  {
    module: "M05",
    type: "Challenge",
    title: "Challenge (Cafe)  lab: Creating a Dynamic Website for the Café (1937896)",
    required: REQUIRED_STATUS.EXTRA_POINT,
    threshold: 60
  },
  {
    module: "M06",
    type: "Challenge",
    title: "Challenge (Cafe) lab: Migrating a Database to Amazon RDS (1937905)",
    required: REQUIRED_STATUS.EXTRA_POINT,
    threshold: 60
  },
  {
    module: "M07",
    type: "Challenge",
    title: "Challenge (Cafe) lab: Creating a VPC Networking Environment for the Café (1937904)",
    required: REQUIRED_STATUS.EXTRA_POINT,
    threshold: 60
  },
  {
    module: "M10",
    type: "Challenge",
    title: "Challenge (Café) lab: Creating a Scalable and Highly Available Environment for the Café (1937908)",
    required: REQUIRED_STATUS.EXTRA_POINT,
    threshold: 60
  },
  {
    module: "M11",
    type: "Challenge",
    title: "Challenge (Café) lab: Automating Infrastructure Deployment (1937907)",
    required: REQUIRED_STATUS.EXTRA_POINT,
    threshold: 60
  },
  {
    module: "M14",
    type: "Challenge",
    title: "Challenge (Café) lab: Implementing a Serverless Architecture for the Café (1937909)",
    required: REQUIRED_STATUS.EXTRA_POINT,
    threshold: 60
  },
  {
    module: "",
    type: "Challenge",
    title: "(Optional) Guided lab: Breaking a Monolithic Node.js Application into Microservices (1937897)",
    required: REQUIRED_STATUS.OPTIONAL,
    threshold: null
  },
  ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((moduleNumber) => ({
    module: "",
    type: "Test",
    title: `Module ${moduleNumber} Knowledge Check (${{
      2: "1937952",
      3: "1937954",
      4: "1937955",
      5: "1937957",
      6: "1937959",
      7: "1937961",
      8: "1937963",
      9: "1937965",
      10: "1937938",
      11: "1937940",
      12: "1937942",
      13: "1937944",
      14: "1937946",
      15: "1937948",
      16: "1937950"
    }[moduleNumber]})`,
    required: REQUIRED_STATUS.NONE,
    threshold: null
  }))
];
