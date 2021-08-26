let { Bme680 } = require('bme680-sensor')

async function main() {
    let sensor = new Bme680(1, 0x76)

    await sensor.initialize()
    
    sensor.setTempOffset(-8)

    setInterval(async () => {
        let data = await sensor.getSensorData()
    
        console.log(data.data.temperature, '˚C')
    }, 1000)
}

main()
