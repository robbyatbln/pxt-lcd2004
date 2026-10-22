declare namespace pins { function i2cWriteNumber(a:number, b:number, f:number):void; }
declare namespace control { function waitMicros(n:number):void; function inBackground(f:()=>void):void; }
declare namespace basic { function pause(n:number):void; }
declare namespace input { function runningTime():number; }
declare enum NumberFormat { UInt8BE }
