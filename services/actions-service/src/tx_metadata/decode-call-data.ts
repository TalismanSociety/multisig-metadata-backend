import { ApiPromise } from "@polkadot/api";
import type { SubmittableExtrinsic } from "@polkadot/api/types";
import type { Call, ExtrinsicPayload } from "@polkadot/types/interfaces";
import { assert, compactToU8a, u8aConcat, u8aEq } from "@polkadot/util";

// Copied from p.js apps because it's not exported in any public packages.
// Full credit to the p.js team.
// Original code: https://github.com/polkadot-js/apps/blob/b6923ea003e1b043f22d3beaa685847c2bc54c24/packages/page-extrinsics/src/Decoder.tsx#L55
// Inherits Apache-2.0 license.
export const decodeCallData = (api: ApiPromise, callData: string) => {
  try {
    let extrinsicCall: Call;
    let extrinsicPayload: ExtrinsicPayload | null = null;
    let decoded: SubmittableExtrinsic<"promise"> | null = null;

    try {
      // cater for an extrinsic input
      const tx = api.tx(callData);

      // ensure that the full data matches here
      if (tx.toHex() !== callData) {
        throw new Error("Cannot decode data as extrinsic, length mismatch");
      }

      decoded = tx;
      extrinsicCall = api.createType("Call", decoded.method);
    } catch {
      try {
        // attempt to decode as Call
        extrinsicCall = api.createType("Call", callData);

        const callHex = extrinsicCall.toHex();

        if (callHex === callData) {
          // all good, we have a call
        } else if (callData.startsWith(callHex)) {
          // this could be an un-prefixed payload...
          const prefixed = u8aConcat(
            compactToU8a(extrinsicCall.encodedLength),
            callData
          );

          extrinsicPayload = api.createType("ExtrinsicPayload", prefixed);

          assert(
            u8aEq(extrinsicPayload.toU8a(), prefixed),
            "Unable to decode data as un-prefixed ExtrinsicPayload"
          );

          extrinsicCall = api.createType(
            "Call",
            extrinsicPayload.method.toHex()
          );
        } else {
          throw new Error(
            "Unable to decode data as Call, length mismatch in supplied data"
          );
        }
      } catch {
        // final attempt, we try this as-is as a (prefixed) payload
        extrinsicPayload = api.createType("ExtrinsicPayload", callData);

        assert(
          extrinsicPayload.toHex() === callData,
          "Unable to decode input data as Call, Extrinsic or ExtrinsicPayload"
        );

        extrinsicCall = api.createType("Call", extrinsicPayload.method.toHex());
      }
    }

    if (!decoded) {
      const { method, section } = api.registry.findMetaCall(
        extrinsicCall.callIndex
      );
      // @ts-ignore
      const extrinsicFn = api.tx[section][method] as any;
      decoded = extrinsicFn(...extrinsicCall.args);

      if (!decoded) throw Error("Unable to decode extrinsic");
      return decoded;
    }

    throw Error("unable to decode");
  } catch (e) {
    throw e;
  }
};
