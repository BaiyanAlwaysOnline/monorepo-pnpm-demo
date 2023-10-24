const fs = require('fs')
const { rm } = require('fs/promises')
const path = require('path')
const execa = require('execa')
const chalk = require('chalk')
const extractor = require('./extractor')

// 并发编译个数
const maxConcurrency = 4
// packages目录下的所有项目
const allTargets = fs.readdirSync('packages').filter(f => {
    // 过滤掉非目录文件
    if (!fs.statSync(`packages/${f}`).isDirectory()) return false
    const pkg = require(`../packages/${f}/package.json`)
    // 过滤掉私有包和不带编译配置的包
    return !(pkg.private && !pkg.buildOptions);
})

// 获取命令行参数
const args = require('minimist')(process.argv.slice(2))
// pnpm build xxx --formats/--f
const targets = args._.length ? args._ : allTargets // 是否有编译目标
const formats = args.formats || args.f // 是否有规定编辑格式

const buildAll = async function () {
    const ret = []
    const executing = []
    for (const item of targets) {
        const p = Promise.resolve().then(() => build(item))
        ret.push(p)
        if (maxConcurrency <= targets.length) {
            const e = p.then(() => executing.splice(executing.indexOf(e), 1))
            executing.push(e)
            if (executing.length >= maxConcurrency) {
                await Promise.race(executing)
            }
        }
    }
    return Promise.all(ret)
}

const build = async function (target) {
    const pkgDir = path.resolve(`packages/${target}`)
    const pkg = require(`${pkgDir}/package.json`)
    if (!formats) {
        await rm(`${pkgDir}/dist`, { recursive: true, force: true })
    }
    // -c 使用配置文件 默认为rollup.config.js
    // --environment 向配置文件传递环境变量 配置文件通过process.env.获取
    await execa(
        'rollup',
        [
            '-c',
            '--environment',
            [`TARGET:${target}`, formats ? `FORMATS:${formats}` : ``]
                .filter(Boolean)
                .join(',')
        ],
        { stdio: 'inherit' }
    )
    if (pkg.types) {
        console.log(
            chalk.bold(chalk.yellow(`Rolling up type definitions for ${target}...`))
        )
        const extractorConfigPath = path.resolve(pkgDir, `api-extractor.json`)
        extractor(extractorConfigPath)
        // 删除ts生成的声明文件
        await rm(`${pkgDir}/dist/packages`, { recursive: true, force: true })
    }
}
buildAll()
