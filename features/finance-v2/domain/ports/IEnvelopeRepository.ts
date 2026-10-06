import type { EnvelopeConfig } from "../EnvelopeConfig";

/**
 * Port: the contract the domain requires for envelope configuration persistence.
 *
 * The envelope config is a single optional global record: present means the
 * envelope feature is active, null means it is off. The port captures exactly
 * those two operations — load and save.
 */
export interface IEnvelopeRepository {
  /**
   * Returns the current envelope config, or `null` when the feature is not yet
   * configured (or has never been saved).
   */
  load(): Promise<EnvelopeConfig | null>;

  /**
   * Persists the envelope config. Overwrites any previously stored config.
   * Callers are responsible for validating the config before calling this.
   */
  save(config: EnvelopeConfig): Promise<void>;
}
