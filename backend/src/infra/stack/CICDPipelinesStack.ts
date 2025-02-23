import {SecretValue, Stack, StackProps, RemovalPolicy} from "aws-cdk-lib";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Artifact, Pipeline,} from "aws-cdk-lib/aws-codepipeline";
import {Construct} from "constructs";
import {GitHubSourceAction, CodeBuildAction, ManualApprovalAction} from "aws-cdk-lib/aws-codepipeline-actions";
import {BuildSpec, PipelineProject, LinuxBuildImage} from "aws-cdk-lib/aws-codebuild";

export class CICDPipelinesStack extends Stack {

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const artifactBucket = new Bucket(this, "ArtifactBucket", {
            versioned: true,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });
      
        const sourceOutput = new Artifact();
        const sourceAction = new GitHubSourceAction({
            actionName: "GitHub_Source",
            owner: "MartinMartinni",
            repo: "aws-shop",
            oauthToken: SecretValue.secretsManager("github-token"),
            output: sourceOutput,
            branch: "main"
        });
      
        const buildOutput = new Artifact();
        const buildProject = new PipelineProject(this, "BuildProject", {
            environment: {
                buildImage: LinuxBuildImage.STANDARD_7_0,// Node.js 18+
            },
            buildSpec: BuildSpec.fromObject({
                version: "0.2",
                phases: {
                    install: {
                        commands: ["cd ui", "npm install"],
                    },
                    build: {
                        commands: ["echo Build started...", "npm run build"],
                    },
                },
                artifacts: {
                    "ui": "dist",
                    files: ["**/*"],
                },
            }),
        });
      
        const buildAction = new CodeBuildAction({
            actionName: "Build",
            project: buildProject,
            input: sourceOutput,
            outputs: [buildOutput],
        });
      
        const testProject = new PipelineProject(this, "TestProject", {
            environment: {
                buildImage: LinuxBuildImage.STANDARD_7_0,// Node.js 18+
            },
            buildSpec: BuildSpec.fromObject({
                version: "0.2",
                phases: {
                    install: {
                        commands: ["cd ui", "npm install"],
                    },
                    build: {
                        commands: ["echo Running tests...", "npm run test"],                    },
                },
            }),
        });
      
        const testAction = new CodeBuildAction({
            actionName: "Test",
            project: testProject,
            input: buildOutput,
        });
      
        const deployAction = new ManualApprovalAction({
            actionName: "Approve_Deploy",
            runOrder: 1,
        });
      
        new Pipeline(this, "MyPipeline", {
        pipelineName: "Pipeline",
        artifactBucket,
        stages: [
            {
                stageName: "Source",
                actions: [sourceAction],
            },
            {
                stageName: "Build",
                actions: [buildAction],
            },
            {
                stageName: "Test",
                actions: [testAction],
            },
            {
                stageName: "Deploy",
                actions: [deployAction],
            },
        ]});
    }
}