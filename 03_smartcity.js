const numbro = require('numbro')
const { AirQualitySensor } = require('./lib/AirQualitySensor')

const SENSOR_ADDR = 0x76

async function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
    const sensor = new AirQualitySensor(SENSOR_ADDR)

    console.log(new Date().toISOString(), 'starting burn in for 5 minutes')

    await sensor.init()
    sensor.sensor.setTempOffset(-8)
    await sensor.calibrate({
        time: 5 * 60 * 1000
    })

    console.log(new Date().toISOString(), 'burn in complete')

    while (true) {
        const data = await sensor.read()

        console.clear()
        console.log(new Date().toISOString(), 'current data:')
        console.table([{
            airQualityIndex: `${numbro(data.airQualityIndex).format({ mantissa: 2 })}`,
            humidity: `${numbro(data.humidity).format({ mantissa: 3 })} %RH`,
            gas: `${numbro(data.gasResistance).format({ mantissa: 2 })} Ohm`,
            temperature: `${numbro(data.temperature).format({ mantissa: 2 })} ºC`,
            pressure: `${numbro(data.pressure).format({ mantissa: 2 })} hPa`,
        }])

        await timeout(1000)
    }
}

main().catch((err) => console.error(err))