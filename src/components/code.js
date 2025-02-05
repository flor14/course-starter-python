import React from 'react'
import { StaticQuery, graphql } from 'gatsby'

import { Hint } from './hint'
import { Button } from './button'
import { ChapterContext, LocaleContext } from '../context'
import classes from '../styles/code.module.sass'

function getFiles({ allCode }, lang) {
    return Object.assign(
        {},
        ...allCode.edges
            .filter(({ node }) => node.lang === lang)
            .map(({ node }) => {
                const isCommand = node.extension === 'sh'
                const code = isCommand ? `!${node.code}` : node.code
                return { [node.name]: { code, isCommand } }
            })
    )
}

function makeTest(template, testFile, solution, isCommand) {
    if (isCommand) {
        // If it's a shell script and command, we don't add it to the test
        // template for execution in Python
        return template.replace(/\${solution}/g, solution).replace(/\${test}/g, '')
    } else {
        return template.replace(/\${solution}/g, solution).replace(/\${test}/g, testFile)
    }
}

class CodeBlock extends React.Component {
    state = { Juniper: null, showSolution: false, key: 0 }

    handleShowSolution() {
        this.setState({ showSolution: true })
    }

    handleReset() {
        // Using the key as a hack to force component to rerender
        this.setState({ showSolution: false, key: this.state.key + 1 })
    }

    updateJuniper() {
        // This type of stuff only really works in class components. I'm not
        // sure why, but I've tried with function components and hooks lots of
        // times and couldn't get it to work. So class component it is.
        if (!this.state.Juniper) {
            // We need a dynamic import here for SSR. Juniper's dependencies
            // include references to the global window object and I haven't
            // managed to fix this using webpack yet. If we imported Juniper
            // at the top level, Gatsby won't build.
            import('./juniper').then(Juniper => {
                this.setState({ Juniper: Juniper.default })
            })
        }
    }

    componentDidMount() {
        this.updateJuniper()
    }

    componentDidUpdate() {
        this.updateJuniper()
    }

    render() {
        const { Juniper, showSolution } = this.state
        const { id, source, solution, test, children } = this.props
        const sourceId = source || `exc_${id}`
        const solutionId = solution || `solution_${id}`
        const testId = test || `test_${id}`
        return (
            <ChapterContext.Consumer>
                {({ lang }) => (
                    <StaticQuery
                        query={graphql`
                            {
                                site {
                                    siteMetadata {
                                        testTemplate
                                        juniper {
                                            repo
                                            branch
                                            kernelType
                                            debug
                                        }
                                    }
                                }
                                allCode {
                                    edges {
                                        node {
                                            name
                                            code
                                            lang
                                            extension
                                        }
                                    }
                                }
                            }
                        `}
                        render={data => {
                            const { testTemplate } = data.site.siteMetadata
                            const {
                                repo,
                                branch,
                                kernelType,
                                debug,
                            } = data.site.siteMetadata.juniper
                            const files = getFiles(data, lang)
                            const sourceFile = files[sourceId] && files[sourceId].code
                            const solutionFile = files[solutionId] && files[solutionId].code
                            const testFile = files[testId] && files[testId].code
                            const isCommand = files[sourceId] && files[sourceId].isCommand
                            return (
                                <LocaleContext.Consumer>
                                    {({ uiText }) => (
                                        <div className={classes.root} key={this.state.key}>
                                            {Juniper && (
                                                <Juniper
                                                    msgButton={null}
                                                    msgLoading={uiText.loading}
                                                    msgError={uiText.connectingFailed}
                                                    msgLaunchDocker={uiText.launchingDocker}
                                                    msgReconnectDocker={uiText.reconnectingDocker}
                                                    classNames={{
                                                        cell: isCommand
                                                            ? classes.cellCmd
                                                            : classes.cell,
                                                        input: classes.input,
                                                        button: classes.button,
                                                        output: classes.output,
                                                    }}
                                                    lineWrapping={isCommand}
                                                    repo={repo}
                                                    branch={branch}
                                                    kernelType={kernelType}
                                                    debug={debug}
                                                    actions={({ runCode }) => (
                                                        <>
                                                            <Button onClick={() => runCode()}>
                                                                {isCommand
                                                                    ? uiText.runCommand
                                                                    : uiText.runCode}
                                                            </Button>
                                                            {testFile && (
                                                                <Button
                                                                    variant="primary"
                                                                    onClick={() =>
                                                                        runCode(value =>
                                                                            makeTest(
                                                                                testTemplate,
                                                                                testFile,
                                                                                value,
                                                                                isCommand
                                                                            )
                                                                        )
                                                                    }
                                                                >
                                                                    {uiText.submit}
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                >
                                                    {showSolution ? solutionFile : sourceFile}
                                                </Juniper>
                                            )}
                                            <Hint
                                                actions={[
                                                    {
                                                        text: uiText.showSolution,
                                                        onClick: () => this.handleShowSolution(),
                                                    },
                                                    {
                                                        text: uiText.reset,
                                                        onClick: () => this.handleReset(),
                                                    },
                                                ]}
                                            >
                                                {children}
                                            </Hint>
                                        </div>
                                    )}
                                </LocaleContext.Consumer>
                            )
                        }}
                    />
                )}
            </ChapterContext.Consumer>
        )
    }
}

export default CodeBlock