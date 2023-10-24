function extractor(extractorConfigPath) {
    const { Extractor, ExtractorConfig } = require('@microsoft/api-extractor')
    const extractorConfig =
        ExtractorConfig.loadFileAndPrepare(extractorConfigPath)
    const extractorResult = Extractor.invoke(extractorConfig, {
        localBuild: true,
        showVerboseMessages: true
    })
    if (extractorResult.succeeded) {
        console.log(`API Extractor completed successfully`)
        process.exitCode = 0
    } else {
        console.error(
            `API Extractor completed with ${extractorResult.errorCount} errors` +
            ` and ${extractorResult.warningCount} warnings`
        )
        process.exitCode = 1
    }
}
module.exports = extractor
