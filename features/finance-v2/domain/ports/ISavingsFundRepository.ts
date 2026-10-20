import type { SavingsFundConfig } from "../SavingsFundConfig";

/**
 * Port: the contract the domain requires for savings fund configuration persistence.
 *
 * The fund config is a single optional global record: present means the savings
 * fund is active, null means it is off. Same two operations as the envelope's port.
 */
export interface ISavingsFundRepository {
  /**
   * Returns the current fund config, or `null` when the feature is not yet
   * configured (or has never been saved).
   */
  load(): Promise<SavingsFundConfig | null>;

  /**
   * Persists the fund config. Overwrites any previously stored config.
   * Callers are responsible for validating the config before calling this.
   */
  save(config: SavingsFundConfig): Promise<void>;
}
