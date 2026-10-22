// PCF8574 wiring: P0=RS, P1=RW, P2=E, P3=backlight, P4..7=D4..7.
//% color=#0fbc11 icon="\uf1ab" block="LCD 20x4"
namespace display {
    let address = 0x27
    let light = 8
    let initialized = false
    let workerStarted = false
    let rows = ["", "", "", ""]
    let speeds = [300, 300, 300, 300]
    let positions = [0, 0, 0, 0]
    let deadlines = [0, 0, 0, 0]
    let dirty = [false, false, false, false]
    let offsets = [0x00, 0x40, 0x14, 0x54]

    function nibble(value: number) {
        let data = value | light
        pins.i2cWriteNumber(address, data, NumberFormat.UInt8BE)
        pins.i2cWriteNumber(address, data | 4, NumberFormat.UInt8BE)
        control.waitMicros(1)
        pins.i2cWriteNumber(address, data, NumberFormat.UInt8BE)
        control.waitMicros(50)
    }
    function send(value: number, rs: number) {
        nibble((value & 0xf0) | rs)
        nibble(((value << 4) & 0xf0) | rs)
    }
    function render(row: number) {
        send(0x80 | offsets[row], 0)
        let text = rows[row].substr(positions[row], 20)
        for (let col = 0; col < 20; col++) {
            let code = col < text.length ? text.charCodeAt(col) : 32
            send(code >= 32 && code <= 126 ? code : 63, 1)
        }
    }
    function ensureInitialized() {
        if (initialized) return
        // No fiber yields during initialization or a complete row transfer.
        control.waitMicros(50000)
        nibble(0x30)
        control.waitMicros(4500)
        nibble(0x30)
        control.waitMicros(4500)
        nibble(0x30)
        control.waitMicros(150)
        nibble(0x20)
        send(0x28, 0)
        send(0x08, 0)
        send(0x01, 0)
        control.waitMicros(2000)
        send(0x06, 0)
        send(0x0c, 0)
        initialized = true
        if (!workerStarted) {
            workerStarted = true
            control.inBackground(() => {
                while (true) {
                    for (let row = 0; row < 4; row++) {
                        let now = input.runningTime()
                        if (dirty[row]) {
                            render(row)
                            dirty[row] = false
                            deadlines[row] = now + 1000
                        } else if (rows[row].length > 20 && now >= deadlines[row]) {
                            let last = rows[row].length - 20
                            positions[row] = positions[row] >= last ? 0 : positions[row] + 1
                            render(row)
                            deadlines[row] = now + (positions[row] == 0 || positions[row] == last ? 1000 : speeds[row])
                        }
                    }
                    basic.pause(10)
                }
            })
        }
    }
    /** Initialize the LCD with its 7-bit adapter address, usually 39 or 63. */
    //% blockId=lcd2004_init block="initialize LCD 20x4 at I2C address %i2cAddress" weight=100
    //% i2cAddress.defl=39 i2cAddress.min=32 i2cAddress.max=63
    export function init(i2cAddress: number = 39) {
        if (i2cAddress < 0x20 || i2cAddress > 0x3f || i2cAddress != Math.floor(i2cAddress)) return
        address = i2cAddress
        initialized = false
        ensureInitialized()
        for (let row = 0; row < 4; row++) {
            positions[row] = 0
            dirty[row] = true
        }
    }
    /** Write row 0 to 3. Text longer than 20 characters scrolls independently. */
    //% weight=87 blockGap=8 blockId=write_String
    //% block="write %str to row %row with speed %speed ms"
    //% row.min=0 row.max=3 speed.min=20 speed.defl=300
    export function writeString(str: string, row: number, speed: number) {
        if (row < 0 || row > 3 || row != Math.floor(row)) return
        ensureInitialized()
        rows[row] = str
        speeds[row] = Math.max(20, speed)
        positions[row] = 0
        dirty[row] = true
    }
    /** Clear all rows and stop scrolling. */
    //% blockId=lcd2004_clear block="clear LCD" weight=80
    export function clear() {
        ensureInitialized()
        for (let row = 0; row < 4; row++) {
            rows[row] = ""
            positions[row] = 0
            dirty[row] = false
        }
        send(0x01, 0)
        control.waitMicros(2000)
    }
    /** Switch the fixed-color backlight on or off. */
    //% blockId=lcd2004_backlight block="LCD backlight %enabled" weight=70
    export function backlight(enabled: boolean) {
        ensureInitialized()
        light = enabled ? 8 : 0
        pins.i2cWriteNumber(address, light, NumberFormat.UInt8BE)
    }
}
