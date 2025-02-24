import {SecretValue, Stack, StackProps, RemovalPolicy} from "aws-cdk-lib";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {Artifact, Pipeline,} from "aws-cdk-lib/aws-codepipeline";
import {Construct} from "constructs";
import {GitHubSourceAction, CodeBuildAction} from "aws-cdk-lib/aws-codepipeline-actions";
import {BuildSpec, PipelineProject, LinuxBuildImage} from "aws-cdk-lib/aws-codebuild";

export interface AbstractCICDPipelinesStackProps extends StackProps {
    suffix: string,
    branch: string
}

export abstract class AbstractCICDPipelinesStack extends Stack {

    protected pipeline: Pipeline;

    constructor(scope: Construct, id: string, props: AbstractCICDPipelinesStackProps) {
        super(scope, id, props);

        const artifactBucket = new Bucket(this, "ArtifactBucket" + props.suffix, {
            versioned: true,
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });
      
        const sourceOutput = new Artifact();
        const sourceAction = new GitHubSourceAction({
            actionName: "GitHub_Source",
            owner: "MartinMartinni",
            repo: "aws-shop",
            oauthToken: SecretValue.secretsManager("github-token2"),
            output: sourceOutput,
            branch: props.branch
        });
      
        const buildOutput = new Artifact();
        const buildProject = new PipelineProject(this, "BuildProject" + props.suffix, {
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
      
        const testProject = new PipelineProject(this, "TestProject" + props.suffix, {
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
      
        this.pipeline = new Pipeline(this, "MyPipeline" + props.suffix, {
        pipelineName: "Pipeline" + props.suffix,
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
            }
        ]});
    }
}