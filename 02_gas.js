let { Bme680 } = require('bme680-sensor')

async function main() {
    let sensor = new Bme680(1, 0x76)

    await sensor.initialize()

    setInterval(async () => {
        let data = await sensor.getSensorData()
    
        console.log(Math.round(data.data.gas_resistance * 100) / 100, 'Ohm')
    }, 1000)
}

main()
