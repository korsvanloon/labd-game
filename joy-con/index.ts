import { JoyCon } from './joycon'

let initialized = false

const connectedJoyCons = new Map<number, JoyCon>()
const devices: HIDDevice[] = []

const getDeviceID = (device: HIDDevice) => {
  const n = devices.indexOf(device)
  if (n >= 0) {
    return n
  }
  devices.push(device)
  return devices.length - 1
}

const addDevice = async (device: HIDDevice) => {
  const id = getDeviceID(device)
  console.log(
    `HID connected: ${id} ${device.productId.toString(16)} ${
      device.productName
    }`,
  )
  const controller = await createJoyCon(id, device)
  connectedJoyCons.set(id, controller)

  return controller
}

const removeDevice = async (device: HIDDevice) => {
  const id = getDeviceID(device)
  console.log(
    `HID disconnected: ${id} ${device.productId.toString(16)} ${
      device.productName
    }`,
  )
  connectedJoyCons.delete(id)
}

export const JoyConConnection = ({
  onChangeControllers,
}: {
  onChangeControllers: (controllers: JoyCon[]) => void
}) => {
  if (initialized) return
  initialized = true

  navigator.hid.addEventListener('connect', async ({ device }) => {
    await addDevice(device)
    onChangeControllers([...connectedJoyCons.values()])
  })

  navigator.hid.addEventListener('disconnect', ({ device }) => {
    removeDevice(device)
    onChangeControllers([...connectedJoyCons.values()])
  })

  navigator.hid
    .getDevices()
    .then((devices) =>
      Promise.all(devices.map(addDevice)).then(() =>
        onChangeControllers([...connectedJoyCons.values()]),
      ),
    )
}

export const requestJoyCon = async () => {
  // Filter on devices with the Nintendo Vendor ID.
  const filters = [
    {
      vendorId: 0x057e, // Nintendo Co., Ltd
    },
  ]
  /*
  // Filter on devices with the Nintendo Switch Joy-Con USB Vendor/Product IDs.
  const filters = {
    {
      vendorId: 0x057e, // Nintendo Co., Ltd
      productId: 0x2006, // Joy-Con Left
    },
    {
      vendorId: 0x057e, // Nintendo Co., Ltd
      productId: 0x2007, // Joy-Con Right
    },
    {
      vendorId: 0x057e, // Nintendo Co., Ltd
      productId: 0x2009, // Pro Controller
    },
    {
      vendorId: 0x057e, // Nintendo Co., Ltd
      productId: 0x200e, // Joy-Con Charging Grip
    },
    {
      vendorId: 0x057e, // Nintendo Co., Ltd
      productId: 0x2017, // SNES Controller, MD/Gen Control Pad
    },
    {
      vendorId: 0x057e, // Nintendo Co., Ltd
      productId: 0x2019, // N64 Controller
    },
  ];
  */
  // Prompt user to select a Joy-Con device.
  try {
    const [device] = await navigator.hid.requestDevice({ filters })
    if (!device) {
      return
    }
    return await addDevice(device)
  } catch (error: any) {
    console.error(error.name, error.message)
  }
}

const createJoyCon = async (id: number, device: HIDDevice) => {
  const joyCon = new JoyCon(id, device)

  await joyCon.open()
  await joyCon.enableUSBHIDJoystickReport()
  await joyCon.enableStandardFullMode()
  await joyCon.enableIMUMode()
  await joyCon.setLED(id)
  return joyCon
}
