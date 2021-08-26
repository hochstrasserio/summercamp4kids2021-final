const numbro = require('numbro')
const { AirQualitySensor } = require('./lib/AirQualitySensor')
const fs = require('fs/promises')
const { createServer } = require('http')
const ejs = require('ejs')
const path = require('path')

const SENSOR_ADDR = 0x76
const PORT = process.env.PORT ?? 8089

async function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function startWebserver() {
    createServer(async (req, res) => {
        let log

        try {
            log = (await fs.readFile(path.resolve(__dirname, './data/data.txt'))).toString()
        } catch (err) {
            res.end(err.toString())
            return
        }

        const data = log
            .split('\n')
            .reverse()
            .slice(1, 50)
            .map((line) => JSON.parse(line))

        try {
            res.end(await ejs.renderFile(path.resolve(__dirname, './templates/index.ejs.html'), {
                data
            }))
        } catch (err) {
            console.error(err)
        }
    }).listen(PORT, '0.0.0.0')
}

async function startSensor() {
    const sensor = new AirQualitySensor(SENSOR_ADDR)

    console.log(new Date().toISOString(), 'starting burn in for 5 minutes')

    await sensor.init()
    sensor.sensor.setTempOffset(-8)

    await sensor.calibrate({
        time: 5 * 60 * 1000
    })

    console.log(new Date().toISOString(), 'burn in complete')

    const log = await fs.open(path.resolve(__dirname, './data/data.txt'), 'a+')
    let lastWrite = null

    while (true) {
        const data = await sensor.read()

        if (!data) {
            await timeout(1000)
            continue
        }

        console.clear()
        console.log(new Date().toISOString(), 'current data:')
        console.table([{
            airQualityIndex: `${numbro(data.airQualityIndex).format({ mantissa: 2 })}`,
            humidity: `${numbro(data.humidity).format({ mantissa: 3 })} %RH`,
            gas: `${numbro(data.gasResistance).format({ mantissa: 2 })} Ohm`,
            temperature: `${numbro(data.temperature).format({ mantissa: 2 })} ºC`,
            pressure: `${numbro(data.pressure).format({ mantissa: 2 })} hPa`,
        }])

        if (lastWrite === null || (new Date().getTime() - lastWrite) > 60 * 1000) {
            console.log('writing data to log')
            await log.write(JSON.stringify({
                ...data,
                timestamp: new Date().getTime(),
            }) + '\n')
            lastWrite = new Date().getTime()
        }

        await timeout(1000)
    }
}

async function main() {
    console.log('starting webserver')
    startWebserver()
    console.log('starting sensor')
    await startSensor()
}

main().catch((err) => console.error(err))